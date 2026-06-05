# 우리팀 인프라 설계

> 소규모 서비스에 맞는 비용 효율적인 구성을 유지하되, 단일 장애점을 제거하고 무중단 배포·자동 복구가 가능한 안정성을 목표로 한다.

---

## 1. 설계 원칙

| 원칙 | 적용 방식 |
|---|---|
| **단일 장애점 제거** | 컴퓨팅(ECS) 2 AZ 분산, DB Multi-AZ 자동 페일오버 |
| **최소 권한** | ALB → ECS → RDS 단방향 보안 그룹, ECS Task Role 최소 권한 |
| **시크릿 코드 분리** | JWT secret·DB 자격증명은 Secrets Manager 관리, 코드·환경변수 하드코딩 금지 |
| **무중단 배포** | Graceful Shutdown + ALB Deregistration + ECS 롤링 배포 조합 |
| **관찰 가능성** | CloudWatch Logs 중앙 수집, 핵심 메트릭 알람으로 장애 조기 감지 |

---

## 2. 전체 아키텍처

```
Internet
    │  (HTTP 80 / HTTPS 443)
    ▼
┌─────────────────────────────────────────────┐
│  Application Load Balancer (Public)         │
│  ap-northeast-2a  ·  ap-northeast-2c        │
└──────────────┬──────────────────────────────┘
               │  (8080, ALB SG만 허용)
    ┌──────────┴──────────┐
    ▼                     ▼
┌────────────┐      ┌────────────┐
│ ECS Task   │      │ ECS Task   │   ← 프라이빗 서브넷
│ (2a)       │      │ (2c)       │     Fargate (최소 2개)
└─────┬──────┘      └──────┬─────┘
      │                    │
      └──────────┬─────────┘
                 │  (3306, ECS SG만 허용)
                 ▼
┌────────────────────────────────┐
│  RDS MySQL 8.0  Multi-AZ       │   ← 프라이빗 서브넷
│  Primary (2a) / Standby (2c)   │
└────────────────────────────────┘

ECS ──► NAT Gateway ──► ECR / Secrets Manager / CloudWatch
```

---

## 3. 네트워크 (VPC)

### CIDR 설계

| 서브넷 | CIDR | AZ | 용도 |
|---|---|---|---|
| public-2a | 10.0.1.0/24 | ap-northeast-2a | ALB, NAT Gateway |
| public-2c | 10.0.2.0/24 | ap-northeast-2c | ALB |
| private-2a | 10.0.11.0/24 | ap-northeast-2a | ECS Fargate |
| private-2c | 10.0.12.0/24 | ap-northeast-2c | ECS Fargate |
| db-2a | 10.0.21.0/24 | ap-northeast-2a | RDS Primary |
| db-2c | 10.0.22.0/24 | ap-northeast-2c | RDS Standby |

- **ECS·RDS는 프라이빗 서브넷에만 위치** — 인터넷에서 직접 접근 불가
- ECS → ECR·Secrets Manager·CloudWatch 아웃바운드는 NAT Gateway 경유
- VPC Endpoint 도입 시 NAT 비용 절감 가능 (추후 최적화)

---

## 4. 보안 그룹 (3계층)

```
Internet ──► alb-sg ──► ecs-sg ──► rds-sg
```

| 보안 그룹 | Inbound 규칙 | Outbound |
|---|---|---|
| `alb-sg` | 80 (HTTP), 443 (HTTPS) from 0.0.0.0/0 | 전체 허용 |
| `ecs-sg` | 8080 from `alb-sg` 만 | 전체 허용 |
| `rds-sg` | 3306 from `ecs-sg` 만 | 전체 허용 |

> ECS 태스크는 ALB를 거치지 않으면 외부에서 절대 접근 불가.
> RDS는 ECS 외 어떤 곳에서도 접근 불가.

---

## 5. 컴퓨팅 (ECS Fargate)

### 태스크 사양

| 항목 | 값 | 비고 |
|---|---|---|
| CPU | 512 (0.5 vCPU) | 소규모 트래픽 기준 |
| Memory | 1024 MB (1 GB) | JVM Heap 512MB 기준 |
| 최소 태스크 수 | **2** | 2 AZ 분산, 한쪽 AZ 장애 시 서비스 유지 |
| 최대 태스크 수 | 6 | Auto Scaling 상한 |

### Auto Scaling

- **스케일 아웃**: ECS 서비스 평균 CPU > **70%** (3분 유지) → 태스크 +1
- **스케일 인**: ECS 서비스 평균 CPU < **40%** (5분 유지) → 태스크 -1 (최소 2 유지)
- 스케일 아웃 쿨다운: 60초 / 스케일 인 쿨다운: 300초

### 롤링 배포 설정

```hcl
deployment_minimum_healthy_percent = 50   # 배포 중 최소 1개 태스크 항상 유지
deployment_maximum_percent         = 200  # 최대 4개(기존 2 + 신규 2) 동시 실행
health_check_grace_period_seconds  = 60   # 태스크 기동 후 헬스체크 유예 시간
```

**배포 흐름**:
1. 신규 태스크 2개 기동
2. ALB 헬스체크 통과 (`GET /actuator/health` → 200)
3. 구 태스크에 SIGTERM 전송
4. 구 태스크 Graceful Shutdown (최대 30초 대기 후 종료)
5. ALB에서 구 태스크 제거 (Deregistration Delay 30초)

> Graceful Shutdown 30초 = ALB Deregistration Delay 30초로 맞춰야 요청 유실 없음.

### Secrets Manager 환경변수 주입

```json
// ECS Task Definition - secrets 블록
{
  "secrets": [
    { "name": "DB_PASSWORD",  "valueFrom": "arn:aws:secretsmanager:...:wooriteam/prod/db-password" },
    { "name": "JWT_SECRET",   "valueFrom": "arn:aws:secretsmanager:...:wooriteam/prod/jwt-secret" }
  ]
}
```

Spring Boot는 `${DB_PASSWORD}`, `${JWT_SECRET}` 환경변수를 그대로 읽음. 코드·이미지에 시크릿 미포함.

---

## 6. 데이터베이스 (RDS MySQL 8.0)

### 인스턴스 설정

| 항목 | 값 | 이유 |
|---|---|---|
| 인스턴스 클래스 | `db.t3.micro` | 소규모 트래픽 적정 사양 |
| **Multi-AZ** | **활성화** | Primary 장애 시 Standby 자동 승격 (~1-2분) |
| 스토리지 | 20GB gp3 | 기본 시작값, Auto Scaling 활성화 |
| **삭제 방지** | **활성화** | 실수로 인한 DB 삭제 방지 |
| 자동 백업 보존 | **7일** | 특정 시점 복구(PITR) 지원 |
| 백업 윈도우 | 04:00-05:00 (KST 13:00) | 새벽 트래픽 최소 시간대 |
| 유지관리 윈도우 | 월요일 05:00-06:00 (KST 14:00) | 패치 재시작 영향 최소화 |

### Parameter Group 주요 설정

```
max_connections        = 100   # ECS 태스크 최대 6개 × HikariCP 10 = 60, 여유분 확보
character_set_server   = utf8mb4
collation_server       = utf8mb4_unicode_ci
slow_query_log         = 1
long_query_time        = 2     # 2초 초과 쿼리 슬로우 로그 기록
```

### HikariCP 커넥션 풀 (Spring Boot)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10      # 태스크당 최대 커넥션
      minimum-idle: 5
      connection-timeout: 30000  # 30초 내 커넥션 미획득 시 예외
      validation-timeout: 5000
      idle-timeout: 600000       # 10분 idle 커넥션 반환
      max-lifetime: 1800000      # 30분 후 커넥션 교체 (RDS 8시간 제한 대비)
```

> max-lifetime < RDS `wait_timeout`(기본 8시간) 이어야 "Connection closed" 에러 방지.

---

## 7. 로드 밸런서 (ALB)

| 항목 | 설정값 |
|---|---|
| 헬스체크 경로 | `GET /actuator/health` |
| 헬스체크 정상 기준 | HTTP 200 |
| 헬스체크 간격 | 30초 |
| 연속 성공 횟수 | 2회 → Healthy |
| 연속 실패 횟수 | 3회 → Unhealthy (트래픽 제거) |
| Deregistration Delay | **30초** (Graceful Shutdown과 동일) |

- HTTPS 적용 시 ACM 인증서 ALB에 연결, HTTP → HTTPS 리다이렉트 리스너 추가

---

## 8. IAM (최소 권한)

### ECS Task Execution Role
ECR 이미지 풀·CloudWatch 로그 전송 전용.

```
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:GetDownloadUrlForLayer
ecr:BatchGetImage
logs:CreateLogStream
logs:PutLogEvents
secretsmanager:GetSecretValue   ← Task Definition secrets 블록 읽기
```

### ECS Task Role
애플리케이션 런타임에서 AWS API 호출이 필요한 경우에만 부여. 현재 MVP 기준 권한 없음.

---

## 9. 모니터링 (CloudWatch)

### 로그

| 로그 그룹 | 보존 기간 | 내용 |
|---|---|---|
| `/ecs/wooriteam` | 30일 | 애플리케이션 stdout/stderr |
| `/rds/wooriteam/slowquery` | 7일 | 2초 초과 쿼리 |

### 알람

| 알람 이름 | 조건 | 임계값 | 조치 |
|---|---|---|---|
| `ecs-cpu-high` | ECS 평균 CPU | > 70%, 3분 | Auto Scaling 스케일 아웃 |
| `ecs-memory-high` | ECS 평균 메모리 | > 80%, 5분 | SNS → 이메일 알림 |
| `alb-5xx-high` | ALB HTTPCode_Target_5XX_Count | > 5건/분 | SNS → 이메일 알림 |
| `rds-connections-high` | RDS DatabaseConnections | > 50개, 1분 | SNS → 이메일 알림 |
| `rds-cpu-high` | RDS CPUUtilization | > 80%, 5분 | SNS → 이메일 알림 |

- SNS Topic → 팀 이메일로 알림 전송
- 알람 발생 시 CloudWatch Logs에서 해당 시간대 로그 먼저 확인

---

## 10. CI/CD 파이프라인 (GitHub Actions)

```
push to main
     │
     ▼
[CI] ./gradlew build test
     │  실패 시 중단
     ▼
[CI] docker build & push to ECR
     │  태그: {github.sha}
     ▼
[CD] ECS Task Definition 새 이미지로 등록
     │
     ▼
[CD] ECS Service 업데이트 (롤링 배포)
     │
     ▼
[CD] aws ecs wait services-stable (배포 완료 대기)
     │  타임아웃 10분, 실패 시 이전 Task Definition으로 수동 롤백
     ▼
배포 완료
```

### GitHub Secrets 목록

| Secret 이름 | 내용 |
|---|---|
| `AWS_ACCESS_KEY_ID` | CI/CD 전용 IAM 계정 |
| `AWS_SECRET_ACCESS_KEY` | CI/CD 전용 IAM 계정 |
| `AWS_REGION` | ap-northeast-2 |
| `ECR_REPOSITORY` | ECR 레포지토리 URI |
| `ECS_CLUSTER` | ECS 클러스터 이름 |
| `ECS_SERVICE` | ECS 서비스 이름 |
| `ECS_TASK_DEFINITION` | Task Definition 이름 |
| `CONTAINER_NAME` | 컨테이너 이름 |

> DB 자격증명·JWT secret은 GitHub Secrets에 저장하지 않음. Secrets Manager에서 ECS가 직접 읽어감.

---

## 11. Terraform 파일 구조

```
infra/
├── main.tf               # provider 설정, S3+DynamoDB 원격 state 백엔드
├── variables.tf          # 환경별 변수 (region, db_password 등)
├── outputs.tf            # ALB DNS, RDS endpoint 등 출력값
├── vpc.tf                # VPC, 서브넷, IGW, NAT GW, 라우팅 테이블
├── security_groups.tf    # alb-sg, ecs-sg, rds-sg
├── alb.tf                # ALB, 타겟 그룹, 리스너, 헬스체크
├── ecs.tf                # ECS Cluster, Task Definition, Service, Auto Scaling
├── rds.tf                # RDS Instance, Subnet Group, Parameter Group
├── secrets.tf            # Secrets Manager 시크릿 정의
├── iam.tf                # Task Execution Role, Task Role
└── cloudwatch.tf         # 로그 그룹, 알람, SNS Topic
```

### Terraform 원격 State 설정

```hcl
# main.tf
terraform {
  backend "s3" {
    bucket         = "wooriteam-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "wooriteam-tfstate-lock"  # 동시 apply 방지
    encrypt        = true
  }
}
```

팀원 여러 명이 동시에 `terraform apply` 하면 state 충돌 발생 → DynamoDB 락 필수.

---

## 12. 장애 시나리오 & 대응

| 시나리오 | 자동 대응 | 수동 확인 |
|---|---|---|
| ECS 태스크 1개 비정상 종료 | ECS가 자동 재시작, ALB가 정상 태스크로만 라우팅 | CloudWatch Logs에서 원인 확인 |
| AZ 전체 장애 | 나머지 AZ 태스크가 트래픽 수용, Auto Scaling 스케일 아웃 | ECS 콘솔에서 태스크 분포 확인 |
| RDS Primary 장애 | Multi-AZ Standby 자동 승격 (~1-2분), ECS HikariCP 재연결 | RDS 콘솔 이벤트 탭 확인 |
| 배포 후 5xx 급증 | CloudWatch 알람 → 이메일 알림 | ECS 콘솔에서 이전 Task Definition으로 서비스 업데이트 |
| 메모리 부족 (OOMKilled) | ECS 태스크 재시작 | Task Definition CPU/Memory 상향 조정 |

---

## 13. 비용 추정 (월)

| 서비스 | 사양 | 예상 비용 |
|---|---|---|
| ECS Fargate | 0.5vCPU × 1GB × 2태스크 × 720h | ~$15 |
| RDS MySQL | db.t3.micro Multi-AZ × 720h | ~$30 |
| ALB | 기본 + LCU | ~$20 |
| NAT Gateway | 1개 × 720h + 전송량 | ~$35 |
| ECR | 이미지 스토리지 | ~$1 |
| Secrets Manager | 2개 시크릿 | ~$1 |
| CloudWatch | 로그·알람 | ~$5 |
| **합계** | | **~$107/월** |

> RDS Multi-AZ가 단일 인스턴스 대비 약 2배 비용이나, Standby 자동 페일오버로 DB 장애 시 수동 복구 시간 0을 목표로 함.
> 비용 절감이 필요하면 NAT Gateway 대신 VPC Endpoint(ECR·S3·Secrets Manager) 도입 검토.