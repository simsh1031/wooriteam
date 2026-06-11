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

> 프론트엔드(React 빌드 산출물)와 백엔드(Spring Boot API)는 **CloudFront 하나의 도메인**으로 통합 노출한다 (커스텀 도메인 구매 여부와 무관 — CloudFront가 기본 제공하는 `*.cloudfront.net` 도메인으로도 동일 구조 운영 가능).
> `/api/*` 요청은 ALB(백엔드)로, 그 외 요청은 S3(프론트 정적 파일)로 라우팅 — 동일 origin이므로 프론트의 상대 경로 API 호출(`baseURL: ''`)과 CORS 문제가 깔끔하게 해결된다. 자세한 내용은 [7-1](#7-1-프론트엔드-배포-s3--cloudfront) 참고.

```
                              Internet
                                  │  (HTTPS 443)
                                  ▼
                           ┌────────────┐
                           │  Route 53  │  (커스텀 도메인 구매 시 — MVP는 생략 가능)
                           └─────┬──────┘
                                 │
                                 ▼
            ┌───────────────────────────────────────────────┐
            │  CloudFront (*.cloudfront.net 또는 커스텀 도메인)│
            │   - 기본 동작 (*)   → S3 (프론트 정적 파일)        │
            │   - /api/*         → ALB (백엔드 API, 캐시 X)   │
            └───────────┬───────────────────────┬───────────┘
                        │                       │ (커스텀 헤더로 직접 접근 차단)
                        ▼                       ▼
            ┌───────────────────────┐   ┌─────────────────────────────────────┐
            │ S3                    │   │  Application Load Balancer (Public) │
            │ wooriteam-frontend    │   │  ap-northeast-2a · ap-northeast-2c  │
            │ (OAC로만 접근 허용)      │   │  서브넷: public-2a, public-2c        │
            └───────────────────────┘   └──────────────┬──────────────────────┘
                                                       │  (8080, ALB SG만 허용)
                                            ┌──────────┴───────────┐
                                            ▼                      ▼
                          ┌─── AZ 2a ────────────────┐  ┌─── AZ 2c ───────────────┐
                          │  NAT Gateway (public-2a) │  │  NAT Gateway (public-2c)│
                          │                          │  │                         │
                          │  ECS Task (Fargate)      │  │  ECS Task (Fargate)     │  ← 프라이빗 서브넷
                          │  (private-2a)            │  │  (private-2c)           │    최소 2개
                          │           │              │  │           │             │
                          │           ▼              │  │           ▼             │
                          │  RDS Primary             │  │  RDS Standby            │  ← DB 전용 서브넷
                          │  (db-2a)                 │  │  (db-2c)                │
                          └──────────────────────────┘  └─────────────────────────┘

ECS(2a) ──► NAT Gateway(public-2a) ──► ECR / Secrets Manager / CloudWatch
ECS(2c) ──► NAT Gateway(public-2c) ──► ECR / Secrets Manager / CloudWatch
```

---

## 3. 네트워크 (VPC)

### 기본 설정

| 항목 | 값 |
|---|---|
| VPC 이름 | `wooriteam-vpc` |
| VPC CIDR | `10.0.0.0/16` |
| DNS hostnames | 활성화 (`enable_dns_hostnames = true`) |
| DNS support | 활성화 (`enable_dns_support = true`) |

### 서브넷 설계

| 리소스 이름 | CIDR | AZ | 용도 | `map_public_ip_on_launch` |
|---|---|---|---|---|
| `wooriteam-public-2a` | `10.0.1.0/24` | ap-northeast-2a | ALB, NAT Gateway | `true` |
| `wooriteam-public-2c` | `10.0.2.0/24` | ap-northeast-2c | ALB | `true` |
| `wooriteam-private-2a` | `10.0.11.0/24` | ap-northeast-2a | ECS Fargate | `false` |
| `wooriteam-private-2c` | `10.0.12.0/24` | ap-northeast-2c | ECS Fargate | `false` |
| `wooriteam-db-2a` | `10.0.21.0/24` | ap-northeast-2a | RDS Primary | `false` |
| `wooriteam-db-2c` | `10.0.22.0/24` | ap-northeast-2c | RDS Standby | `false` |

### 인터넷 게이트웨이 (IGW)

```hcl
# 리소스 이름: wooriteam-igw
# VPC에 attach
# Public 서브넷의 라우팅 테이블에만 연결
```

### NAT Gateway

| 리소스 이름 | 위치 | EIP | 용도 |
|---|---|---|---|
| `wooriteam-nat-2a` | `wooriteam-public-2a` | `aws_eip.nat_2a` (`domain = "vpc"`) | private-2a ECS → 인터넷 아웃바운드 |
| `wooriteam-nat-2c` | `wooriteam-public-2c` | `aws_eip.nat_2c` (`domain = "vpc"`) | private-2c ECS → 인터넷 아웃바운드 |

> NAT Gateway를 AZ별로 1개씩 운영해 단일 장애점을 제거한다. 한 AZ가 장애여도 나머지 AZ의 ECS 아웃바운드(ECR, Secrets Manager, CloudWatch)는 정상 유지된다.

### 라우팅 테이블

| 라우팅 테이블 이름 | 연결 서브넷 | 라우팅 규칙 |
|---|---|---|
| `wooriteam-public-rt` | public-2a, public-2c | `0.0.0.0/0` → IGW |
| `wooriteam-private-rt-2a` | private-2a | `0.0.0.0/0` → NAT Gateway (2a) |
| `wooriteam-private-rt-2c` | private-2c | `0.0.0.0/0` → NAT Gateway (2c) |
| `wooriteam-db-rt` | db-2a, db-2c | (인터넷 라우팅 없음, VPC 내부만) |

> 프라이빗 라우팅 테이블을 AZ별로 분리해 각 ECS 태스크가 동일 AZ의 NAT Gateway를 사용하도록 한다. AZ 장애 시 영향 범위가 해당 AZ로만 격리된다. DB 서브넷은 외부 아웃바운드 차단.

---

## 4. 보안 그룹

```
Internet ──► alb-sg ──► ecs-sg ──► rds-sg
```

### alb-sg (`wooriteam-alb-sg`)

| 방향 | 포트 | 프로토콜 | 소스 | 설명 |
|---|---|---|---|---|
| Inbound | 80 | TCP | `0.0.0.0/0` | HTTP |
| Inbound | 443 | TCP | `0.0.0.0/0` | HTTPS |
| Outbound | ALL | ALL | `0.0.0.0/0` | 전체 허용 |

### ecs-sg (`wooriteam-ecs-sg`)

| 방향 | 포트 | 프로토콜 | 소스 | 설명 |
|---|---|---|---|---|
| Inbound | 8080 | TCP | `alb-sg` (SG ID 참조) | ALB에서만 수신 |
| Outbound | ALL | ALL | `0.0.0.0/0` | ECR/Secrets Manager/CloudWatch 아웃바운드 |

### rds-sg (`wooriteam-rds-sg`)

| 방향 | 포트 | 프로토콜 | 소스 | 설명 |
|---|---|---|---|---|
| Inbound | 3306 | TCP | `ecs-sg` (SG ID 참조) | ECS에서만 수신 |
| Outbound | ALL | ALL | `0.0.0.0/0` | 전체 허용 |

> 보안 그룹 간 참조 방식 사용 (CIDR 참조 금지). ECS SG ID가 변경되면 RDS SG도 자동 반영.

---

## 5. ECR

| 항목 | 값 |
|---|---|
| 레포지토리 이름 | `wooriteam` |
| 이미지 태그 변경성 | `MUTABLE` (같은 태그 덮어쓰기 허용, sha 태그로 관리) |
| 스캔 on push | `true` (기본 이미지 취약점 스캔) |
| 암호화 | `AES256` (기본값) |

### 이미지 수명주기 정책

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "최신 10개 이미지만 보관",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["sha-"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": { "type": "expire" }
    },
    {
      "rulePriority": 2,
      "description": "untagged 이미지 1일 후 삭제",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1
      },
      "action": { "type": "expire" }
    }
  ]
}
```

### 이미지 URI 패턴

```
{aws_account_id}.dkr.ecr.ap-northeast-2.amazonaws.com/wooriteam:{github.sha}
```

---

## 6. 컴퓨팅 (ECS Fargate)

### 클러스터

| 항목 | 값 |
|---|---|
| 클러스터 이름 | `wooriteam-cluster` |
| Container Insights | 활성화 (`setting { name = "containerInsights", value = "enabled" }`) |

### 태스크 정의 (Task Definition)

| 항목 | 값 |
|---|---|
| Family 이름 | `wooriteam-task` |
| Network mode | `awsvpc` |
| 실행 타입 | `FARGATE` |
| CPU | `512` (0.5 vCPU) |
| Memory | `1024` MB |
| Task Execution Role | `wooriteam-task-execution-role` |
| Task Role | (MVP 기준 없음) |

### 컨테이너 정의

| 항목 | 값 |
|---|---|
| 컨테이너 이름 | `wooriteam-app` |
| 이미지 | ECR URI (CD에서 동적 교체) |
| 포트 | `8080` (tcp) |
| 로그 드라이버 | `awslogs` |
| 로그 그룹 | `/ecs/wooriteam` |
| 로그 리전 | `ap-northeast-2` |
| 로그 스트림 접두사 | `ecs` |

### 환경변수 및 시크릿

```json
"environment": [
{ "name": "SPRING_PROFILES_ACTIVE", "value": "prod" },
{ "name": "DB_HOST",                "value": "<RDS_ENDPOINT>" },
{ "name": "DB_PORT",                "value": "3306" },
{ "name": "DB_NAME",                "value": "wooriteam" },
{ "name": "CORS_ALLOWED_ORIGINS",   "value": "<CLOUDFRONT_DOMAIN>" }
],
"secrets": [
{ "name": "DB_USERNAME", "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{account_id}:secret:wooriteam/prod/db-username" },
{ "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{account_id}:secret:wooriteam/prod/db-password" },
{ "name": "JWT_SECRET",  "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:{account_id}:secret:wooriteam/prod/jwt-secret" }
]
```

### ECS 서비스

| 항목 | 값 |
|---|---|
| 서비스 이름 | `wooriteam-service` |
| 실행 타입 | `FARGATE` |
| 원하는 태스크 수 | `2` |
| 배포 최소 healthy % | `50` |
| 배포 최대 % | `200` |
| 헬스체크 유예 시간 | `60`초 |
| 서브넷 | `private-2a`, `private-2c` |
| 보안 그룹 | `ecs-sg` |
| 퍼블릭 IP 할당 | `false` |
| 로드 밸런서 타겟 그룹 | `wooriteam-tg` |
| 컨테이너 이름:포트 | `wooriteam-app:8080` |

### Auto Scaling

| 항목 | 값 |
|---|---|
| 스케일링 대상 | `ecs:service:DesiredCount` |
| 최소값 | `2` |
| 최대값 | `6` |
| 스케일 아웃 조건 | CPU > 70%, 3분 유지 → +1 태스크 |
| 스케일 인 조건 | CPU < 40%, 5분 유지 → -1 태스크 |
| 스케일 아웃 쿨다운 | 60초 |
| 스케일 인 쿨다운 | 300초 |

### 롤링 배포 흐름

1. 신규 태스크 2개 기동
2. ALB 헬스체크 통과 (`GET /actuator/health` → 200)
3. 구 태스크에 SIGTERM 전송
4. 구 태스크 Graceful Shutdown (최대 30초 대기 후 종료)
5. ALB에서 구 태스크 제거 (Deregistration Delay 30초)

> Graceful Shutdown 30초 = ALB Deregistration Delay 30초. 이 값이 다르면 요청 유실 발생.

Spring Boot 설정 (`application-prod.yaml`):
```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

---

## 7. 로드 밸런서 (ALB)

### 기본 설정

| 항목 | 값 |
|---|---|
| 이름 | `wooriteam-alb` |
| 타입 | `application` |
| Scheme | `internet-facing` |
| IP 타입 | `ipv4` |
| 보안 그룹 | `alb-sg` |
| 서브넷 | `public-2a`, `public-2c` |

### 타겟 그룹

| 항목 | 값 |
|---|---|
| 이름 | `wooriteam-tg` |
| 프로토콜 | `HTTP` |
| 포트 | `8080` |
| 타겟 타입 | `ip` (Fargate는 ip 타입 필수) |
| VPC | `wooriteam-vpc` |
| 헬스체크 경로 | `/actuator/health` |
| 헬스체크 프로토콜 | `HTTP` |
| 헬스체크 간격 | `30`초 |
| 헬스체크 타임아웃 | `5`초 |
| Healthy threshold | `2`회 |
| Unhealthy threshold | `3`회 |
| 정상 응답 코드 | `200` |
| Deregistration Delay | `30`초 |

### 리스너

| 리스너 | 포트 | 프로토콜 | 규칙 |
|---|---|---|---|
| HTTP 리스너 | 80 | HTTP | → HTTPS 301 리다이렉트 (ACM 인증서 발급 후 적용) |
| HTTPS 리스너 | 443 | HTTPS | → `wooriteam-tg` Forward |

> MVP 초기에는 HTTP 80 → `wooriteam-tg` Forward로 단순 구성 가능. 도메인 연결 후 ACM + HTTPS로 전환.

---

## 7-1. 프론트엔드 배포 (S3 + CloudFront)

### 설계 방향

- 프론트엔드(React 빌드 산출물 `frontend/dist`)는 **S3에 정적 호스팅**하고, **CloudFront**가 CDN이자 단일 진입점 역할을 한다.
- 프론트와 백엔드를 **CloudFront 하나의 도메인(`wooriteam.com`)** 에서 함께 서빙한다 — 캐시 동작(Behavior)으로 경로별 오리진을 분기한다.
    - `/api/*` → ALB(백엔드) 오리진으로 forward (캐시 비활성화)
    - 기본(`*`) → S3(프론트 정적 파일) 오리진 (캐시 활성화)
- **장점**: 프론트와 API가 동일 origin이 되어
    - `frontend/src/api/client.ts`의 `axios.create({ baseURL: '' })` (상대 경로 호출)이 운영 환경에서도 그대로 동작한다 (별도 절대 URL 환경변수 분기 불필요).
    - 브라우저가 Cross-Origin으로 인식하지 않아 CORS preflight가 발생하지 않는다 — `SecurityConfig`의 CORS 설정이 단순해진다.

### S3 버킷 (`wooriteam-frontend`)

| 항목 | 값 |
|---|---|
| 버킷 이름 | `wooriteam-frontend-${account_id}` |
| 퍼블릭 액세스 차단 | 전체 활성화 (`block_public_acls/policy/... = true`) |
| 버킷 정책 | CloudFront **OAC**(Origin Access Control)에서 오는 요청만 `s3:GetObject` 허용 |
| 정적 웹사이트 호스팅 | 비활성화 (S3 직접 접근 차단, 반드시 CloudFront 경유) |
| 버저닝 | 비활성화 (배포 시 덮어쓰기, 캐시 무효화로 갱신 처리) |

### CloudFront 배포 (`wooriteam-cdn`)

| 항목 | 값 |
|---|---|
| 설명 | `wooriteam-cdn` |
| 가격 등급 | `PriceClass_200` (한국 포함 아시아·유럽·북미, 비용 절감) |
| 기본 루트 객체 | `index.html` |
| 커스텀 에러 응답 | `403`, `404` → `/index.html` (`200`)  — React Router의 클라이언트 라우팅(새로고침 시 404 방지) 대응 |
| 뷰어 프로토콜 정책 | `redirect-to-https` |
| Alias(대체 도메인) | (MVP: 미설정 — CloudFront 기본 도메인 `*.cloudfront.net` 그대로 사용. 도메인 구매 시 추가) |
| 인증서 | (MVP: CloudFront 기본 인증서로 HTTPS 자동 적용. 커스텀 도메인 연결 시 ACM을 **`us-east-1` 리전에서 별도 발급** 필요 — CloudFront 요구사항) |

#### 오리진 1 — S3 (`wooriteam-frontend`)

| 항목 | 값 |
|---|---|
| 오리진 액세스 제어 | OAC (`origin_access_control`) |
| 캐시 동작 경로 | `Default (*)` |
| 캐시 정책 | `CachingOptimized` (관리형) |
| 허용 메서드 | `GET, HEAD` |

#### 오리진 2 — ALB (`wooriteam-alb`)

| 항목 | 값 |
|---|---|
| 오리진 프로토콜 정책 | `http-only` (MVP, ALB 80 리스너) → 추후 `https-only`로 전환 |
| 캐시 동작 경로 | `/api/*` |
| 캐시 정책 | `CachingDisabled` (관리형) — API 응답은 캐시하지 않음 |
| Origin Request 정책 | `AllViewerExceptHostHeader` (관리형) — `Authorization`, `Content-Type`, 쿼리스트링, 쿠키를 그대로 ALB로 전달해야 JWT 인증이 정상 동작 |
| 허용 메서드 | `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE` |
| 커스텀 오리진 헤더 | `X-From-CloudFront: <난수 값>` — ALB가 CloudFront 경유 트래픽만 식별하도록 표시 |

### ALB 직접 접근 차단 ("CloudFront 경유만 허용")

ALB는 `internet-facing`이라 DNS만 알면 CloudFront를 우회해 직접 접근할 수 있다. 이를 막기 위해 ALB 리스너에 규칙을 추가한다.

```
ALB HTTP 리스너 규칙:
  1순위 — 조건: HTTP 헤더 `X-From-CloudFront` 값이 <난수 값>과 일치
          동작: wooriteam-tg Forward
  기본 동작(미일치): 403 Fixed Response
```

> `<난수 값>`은 Secrets Manager 시크릿(`wooriteam/prod/cloudfront-origin-secret`)으로 관리하고, CloudFront 오리진 커스텀 헤더와 ALB 리스너 규칙 양쪽에서 동일한 값을 참조한다(Terraform `random_password` 리소스로 생성 후 양쪽에 주입 가능).

### 도메인 / DNS / ACM — MVP는 도메인 없이도 동일 구조로 운영 가능

| 단계 | 서비스 접속 주소 | 설정 |
|---|---|---|
| **MVP (도메인 미구매)** | CloudFront 기본 도메인 (예: `https://d1a2b3c4d5.cloudfront.net`) | Alias·ACM·Route 53 설정 불필요. CloudFront가 자동으로 HTTPS 인증서를 제공한다. |
| **도메인 구매 후 (선택)** | `wooriteam.com` | ① `us-east-1` 리전에서 ACM 인증서 발급 → ② CloudFront에 Alias로 등록 → ③ Route 53(or 사용 중인 DNS)에서 `wooriteam.com` → CloudFront Alias A 레코드 연결. **CloudFront/S3/ALB 구조는 전혀 바뀌지 않고 도메인만 얹는 형태**라 나중에 추가해도 무방하다. |

> 프론트와 API가 같은 origin을 쓰므로(`https://<CloudFront 도메인>`) `api.example.com` 같은 별도 서브도메인은 어느 단계에서도 필요 없다.

### CORS 설정과의 관계

CloudFront를 통해 프론트와 API가 **동일 origin**이 되므로 운영 환경의 일반적인 사용자 브라우저 요청은 Cross-Origin이 아니다(CORS preflight 없음). 다만 `SecurityConfig`의 `cors.allowed-origins`(`SecurityConfig.java:39`) 자체를 제거하지는 않는다 — 다른 출처에서의 직접 API 호출을 막는 안전장치로 유지한다. 값은 그때그때 "프론트가 실제로 서빙되는 주소"를 넣으면 된다.

| 환경 | `CORS_ALLOWED_ORIGINS` 값 |
|---|---|
| 운영 — MVP (도메인 없음) | `https://<CloudFront 배포 도메인>` (예: `https://d1a2b3c4d5.cloudfront.net`) |
| 운영 — 도메인 구매 후 | `https://wooriteam.com` (값만 교체, ECS Task 환경변수 갱신 후 재배포) |
| 로컬 개발 | `http://localhost:5173` (`application.yaml` 기본값 유지) |

### 프론트엔드 배포 파이프라인 (CD)

1. `npm ci && npm run build` (Vite 빌드 → `frontend/dist`)
2. `aws s3 sync frontend/dist s3://wooriteam-frontend-${account_id} --delete`
3. `aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"` (캐시 무효화)

> 백엔드 배포(`cd.yml`의 ECS 롤링 배포)와 동일 워크플로 내 별도 job으로 구성하거나, `frontend/**` 경로 변경 시에만 트리거되는 별도 워크플로(`cd-frontend.yml`)로 분리할 수 있다.

---

## 7-2. Route 53 (도메인 연결)

> MVP 단계에서는 CloudFront 기본 도메인(`*.cloudfront.net`)으로 운영하므로 Route 53 설정이 불필요하다. 커스텀 도메인 구매 후 아래 설정을 추가한다.

### Hosted Zone

```hcl
# 커스텀 도메인 구매 후 활성화 (var.domain_name != "" 조건부)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name   # 예: "wooriteam.com"
}
```

### DNS 레코드

| 레코드 이름 | 타입 | 값 | 설명 |
|---|---|---|---|
| `wooriteam.com` | A (Alias) | CloudFront 배포 도메인 | 메인 도메인 → CloudFront |
| `www.wooriteam.com` | CNAME | `wooriteam.com` | www 리다이렉트 (선택) |

```hcl
resource "aws_route53_record" "main" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}
```

### ACM 인증서

CloudFront에 커스텀 도메인을 연결하려면 **`us-east-1` 리전**에서 ACM 인증서를 발급해야 한다 (CloudFront 요구사항).

```hcl
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "main" {
  count             = var.domain_name != "" ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method = "DNS"
}

resource "aws_route53_record" "cert_validation" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = tolist(aws_acm_certificate.main[0].domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.main[0].domain_validation_options)[0].resource_record_type
  records = [tolist(aws_acm_certificate.main[0].domain_validation_options)[0].resource_record_value]
  ttl     = 60
}
```

### 도메인 연결 절차

```
1. 도메인 구매 (Route 53 또는 외부 DNS 업체)
2. terraform.tfvars에 domain_name = "wooriteam.com" 설정
3. terraform apply → Route 53 Hosted Zone + ACM 인증서 생성
4. 외부 DNS 업체 사용 시: Route 53 Name Server 4개를 도메인 업체 NS 레코드에 등록
5. ACM DNS 검증 완료 대기 (수 분 ~ 수 시간)
6. CloudFront에 Alias + 인증서 연결 (cloudfront.tf의 viewer_certificate 블록 활성화)
```

> CloudFront/ALB/ECS/RDS 구조는 도메인 유무와 무관하게 동일하다. 도메인 연결은 CloudFront 앞에 Route 53만 얹는 형태라 기존 인프라를 재구성할 필요가 없다.

---

## 8. 데이터베이스 (RDS MySQL 8.0)

### 인스턴스 설정

| 항목 | 값 |
|---|---|
| 식별자 | `wooriteam-db` |
| 엔진 | `mysql` |
| 엔진 버전 | `8.0.35` |
| 인스턴스 클래스 | `db.t3.micro` |
| 스토리지 타입 | `gp3` |
| 스토리지 용량 | `20` GB |
| 스토리지 Auto Scaling | 활성화, 최대 `100` GB |
| **Multi-AZ** | **`true`** |
| DB 이름 | `wooriteam` |
| 마스터 사용자명 | `admin` |
| 마스터 비밀번호 | Secrets Manager에서 주입 (코드 하드코딩 금지) |
| 퍼블릭 접근 | `false` |
| 서브넷 그룹 | `wooriteam-db-subnet-group` |
| 보안 그룹 | `rds-sg` |
| **삭제 방지** | **`true`** |
| 최종 스냅샷 | `true` (`final_snapshot_identifier = "wooriteam-db-final"`) |
| 자동 백업 보존 | `7`일 |
| 백업 윈도우 (UTC) | `04:00-05:00` (KST 13:00) |
| 유지관리 윈도우 (UTC) | `mon:05:00-mon:06:00` (KST 월 14:00) |
| Parameter Group | `wooriteam-mysql8-pg` |

### DB Subnet Group

```hcl
# 이름: wooriteam-db-subnet-group
# 서브넷: db-2a (10.0.21.0/24), db-2c (10.0.22.0/24)
```

### Parameter Group (`wooriteam-mysql8-pg`)

| 파라미터 | 값 | 설명 |
|---|---|---|
| `character_set_server` | `utf8mb4` | 한글·이모지 지원 |
| `collation_server` | `utf8mb4_unicode_ci` | 대소문자 구분 없는 정렬 |
| `character_set_client` | `utf8mb4` | |
| `max_connections` | `100` | 태스크 6 × HikariCP 10 = 60, 여유분 확보 |
| `slow_query_log` | `1` | 슬로우 쿼리 로깅 활성화 |
| `long_query_time` | `2` | 2초 초과 쿼리 기록 |
| `general_log` | `0` | 운영 환경에서는 비활성화 |

### HikariCP 커넥션 풀 (`application-prod.yaml`)

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      pool-name: wooriteam-pool
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000   # 30초
      validation-timeout: 5000    # 5초
      idle-timeout: 600000        # 10분
      max-lifetime: 1800000       # 30분 (RDS wait_timeout 8시간보다 짧게)
      connection-test-query: SELECT 1
```

---

## 9. IAM

### ECS Task Execution Role (`wooriteam-task-execution-role`)

ECS가 ECR에서 이미지를 pull하고, CloudWatch에 로그를 쓰고, Secrets Manager에서 시크릿을 읽는 역할.

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

**Managed Policy**: `arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy`

**Inline Policy (Secrets Manager 추가 권한)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": [
      "arn:aws:secretsmanager:ap-northeast-2:{account_id}:secret:wooriteam/prod/*"
    ]
  }]
}
```

### CI/CD IAM User (`wooriteam-cicd`)

GitHub Actions 전용 계정. Console 접근 불가 (access key만).

**Inline Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECR",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECS",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::{account_id}:role/wooriteam-task-execution-role"
    },
    {
      "Sid": "FrontendDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::wooriteam-frontend-{account_id}",
        "arn:aws:s3:::wooriteam-frontend-{account_id}/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::{account_id}:distribution/{cloudfront_distribution_id}"
    }
  ]
}
```

> `s3:PutObject`/`DeleteObject`는 `aws s3 sync --delete`로 빌드 산출물을 통째로 교체하는 데 필요하고, `cloudfront:CreateInvalidation`은 배포 후 `/*` 캐시를 무효화해 사용자가 새 버전을 즉시 받도록 하는 데 필요하다.

---

## 10. Secrets Manager

| 시크릿 이름 | 키 | 설명 |
|---|---|---|
| `wooriteam/prod/db-username` | `username` | RDS 마스터 사용자명 |
| `wooriteam/prod/db-password` | `password` | RDS 마스터 비밀번호 |
| `wooriteam/prod/jwt-secret` | `secret` | JWT 서명 키 (256bit 이상) |
| `wooriteam/prod/cloudfront-origin-secret` | `secret` | CloudFront → ALB 커스텀 헤더 검증용 난수 값 ([7-1](#alb-직접-접근-차단-cloudfront-경유만-허용) 참고) |

> Terraform에서 시크릿 `value`는 `sensitive = true` 처리. `terraform.tfvars`에 넣고 `.gitignore` 필수.

---

## 11. 모니터링

### 전체 구조

```
ECS / RDS / ALB
      │  메트릭 자동 수집
      ▼
CloudWatch (메트릭 저장소 + 로그 수집)
      │
      ├──► CloudWatch 알람 ──► SNS ──► Discord (즉시 알림)
      │
      └──► Grafana Cloud (시각화 대시보드)
                  │  CloudWatch 데이터소스 연결
                  └──► Grafana Alert ──► Discord (임계값 기반 알림)
```

> CloudWatch가 데이터 저장소 역할, Grafana Cloud가 시각화·알림 역할을 담당.
> 둘 다 무료 티어로 운영 가능. CloudWatch 알람은 Auto Scaling 트리거 용도로 유지.

---

### 11-1. CloudWatch 로그 그룹

| 로그 그룹 | 보존 기간 | 내용 |
|---|---|---|
| `/ecs/wooriteam` | `30`일 | 애플리케이션 stdout/stderr |
| `/ecs/wooriteam/access` | `14`일 | ALB 액세스 로그 (요청별 응답시간·상태코드) |
| `/rds/wooriteam/slowquery` | `7`일 | 2초 초과 쿼리 |

**ALB 액세스 로그 활성화 (`alb.tf`)**

```hcl
resource "aws_lb" "main" {
  # ... 기존 설정 ...
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "wooriteam-alb"
    enabled = true
  }
}

# ALB 로그용 S3 버킷
resource "aws_s3_bucket" "alb_logs" {
  bucket        = "wooriteam-alb-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    id     = "delete-old-logs"
    status = "Enabled"
    expiration { days = 14 }
  }
}
```

---

### 11-2. CloudWatch 알람

**SNS Topic**

| 항목 | 값 |
|---|---|
| 이름 | `wooriteam-alerts` |
| 구독 1 | 팀 이메일 (`email` 프로토콜) |
| 구독 2 | Discord Webhook Lambda (`lambda` 프로토콜) — 아래 11-4 참고 |

**알람 목록**

| 알람 이름 | 네임스페이스 | 메트릭 | 조건 | 기간 | 조치 |
|---|---|---|---|---|---|
| `wooriteam-ecs-cpu-high` | `AWS/ECS` | `CPUUtilization` | > 70% | 3분 (1분×3) | Auto Scaling 스케일 아웃 |
| `wooriteam-ecs-cpu-critical` | `AWS/ECS` | `CPUUtilization` | > 90% | 2분 | SNS → Discord |
| `wooriteam-ecs-memory-high` | `AWS/ECS` | `MemoryUtilization` | > 80% | 5분 | SNS → Discord |
| `wooriteam-ecs-task-count-low` | `AWS/ECS` | `RunningTaskCount` | < 2 | 1분 | SNS → Discord |
| `wooriteam-alb-5xx-high` | `AWS/ApplicationELB` | `HTTPCode_Target_5XX_Count` | > 5건 | 1분 | SNS → Discord |
| `wooriteam-alb-4xx-high` | `AWS/ApplicationELB` | `HTTPCode_Target_4XX_Count` | > 50건 | 5분 | SNS → Discord |
| `wooriteam-alb-latency-high` | `AWS/ApplicationELB` | `TargetResponseTime` | > 2초 (p95) | 5분 | SNS → Discord |
| `wooriteam-rds-connections-high` | `AWS/RDS` | `DatabaseConnections` | > 50개 | 1분 | SNS → Discord |
| `wooriteam-rds-cpu-high` | `AWS/RDS` | `CPUUtilization` | > 80% | 5분 | SNS → Discord |
| `wooriteam-rds-freestorage-low` | `AWS/RDS` | `FreeStorageSpace` | < 5GB | 5분 | SNS → Discord |
| `wooriteam-rds-replica-lag` | `AWS/RDS` | `ReplicaLag` | > 30초 | 1분 | SNS → Discord |

> CloudWatch 알람 Dimensions:
> - ECS: `ClusterName = wooriteam-cluster`, `ServiceName = wooriteam-service`
> - RDS: `DBInstanceIdentifier = wooriteam-db`
> - ALB: `LoadBalancer = <ALB ARN suffix>`

---

### 11-3. Grafana Cloud 연동

**선택 이유**: CloudWatch 단독으로는 알람 문자 받는 수준. Grafana를 붙이면 시계열 그래프·대시보드로 장애 원인을 빠르게 파악할 수 있음. 프리티어로 충분히 운영 가능.

**프리티어 한도**: 메트릭 10,000 series / 로그 50GB / 월

**설정 순서**

```
1. https://grafana.com/auth/sign-up 에서 무료 계정 생성
2. Grafana Cloud 스택 생성 (wooriteam)
3. Connections > AWS > CloudWatch 데이터소스 추가
4. IAM 연동 (아래 IAM 정책 참고)
5. 대시보드 import
```

**Grafana용 IAM Policy (`wooriteam-grafana-policy`)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms",
        "logs:DescribeLogGroups",
        "logs:GetLogEvents",
        "logs:StartQuery",
        "logs:GetQueryResults",
        "ec2:DescribeRegions",
        "tag:GetResources"
      ],
      "Resource": "*"
    }
  ]
}
```

> Grafana Cloud는 IAM User의 Access Key로 인증하거나, AWS 권장 방식인 OIDC 연동(IAM Role)으로 설정 가능.
> Access Key 방식이 설정이 빠름. Grafana Cloud UI → AWS 플러그인 → Access Key 입력.

**권장 대시보드 (import ID)**

| 대시보드 | Grafana ID | 용도 |
|---|---|---|
| AWS ECS | `23` | ECS CPU/메모리/태스크 수 |
| AWS RDS | `707` | RDS 커넥션/CPU/스토리지 |
| AWS ALB | `650` | ALB 요청수/5xx/응답시간 |
| AWS CloudWatch Logs | `13639` | 로그 탐색 |

> Grafana 대시보드 → `+` → Import → ID 입력으로 즉시 적용 가능.

**Grafana Alert 설정 (Discord 연동)**

```
1. Grafana Cloud > Alerting > Contact points > New contact point
   - Type: Discord
   - Webhook URL: {Discord Webhook URL}

2. Notification policies에서 Default policy → Discord로 라우팅

3. Alert rules 예시:
   - ECS CPU > 80% (5분) → Discord #alerts
   - ALB 5xx > 10건/분 → Discord #alerts
   - RDS 커넥션 > 60개 → Discord #alerts
```

---

### 11-4. Discord 알림 연동 (SNS → Lambda → Discord)

CloudWatch 알람 → SNS → Lambda → Discord Webhook 순으로 연결.

**Lambda 함수 (`wooriteam-alert-notifier`)**

```python
# lambda_function.py
import json
import urllib.request
import os

DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]

def lambda_handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    alarm_name  = message.get("AlarmName", "")
    state       = message.get("NewStateValue", "")
    reason      = message.get("NewStateReason", "")
    timestamp   = message.get("StateChangeTime", "")

    color = 0xFF0000 if state == "ALARM" else 0x00FF00  # 빨강/초록

    payload = {
        "embeds": [{
            "title": f"{'🚨' if state == 'ALARM' else '✅'} {alarm_name}",
            "description": reason,
            "color": color,
            "fields": [
                {"name": "상태", "value": state, "inline": True},
                {"name": "시간", "value": timestamp, "inline": True}
            ]
        }]
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DISCORD_WEBHOOK,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    urllib.request.urlopen(req)
```

**Terraform 설정 (`cloudwatch.tf`에 추가)**

```hcl
resource "aws_lambda_function" "alert_notifier" {
  function_name    = "wooriteam-alert-notifier"
  role             = aws_iam_role.lambda_alert.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  filename         = "lambda_alert.zip"   # 위 Python 파일을 zip으로 패키징

  environment {
    variables = {
      DISCORD_WEBHOOK_URL = var.discord_webhook_url
    }
  }
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.alert_notifier.arn
}

resource "aws_lambda_permission" "sns" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_notifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}
```

**Lambda IAM Role**

```hcl
resource "aws_iam_role" "lambda_alert" {
  name = "wooriteam-lambda-alert-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_alert.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

---

### 11-5. CloudWatch Dashboard (콘솔 대시보드)

Terraform으로 CloudWatch 대시보드도 코드 관리 가능.

```hcl
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "wooriteam-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "ECS CPU Utilization"
          metrics = [["AWS/ECS", "CPUUtilization",
            "ClusterName", "wooriteam-cluster",
            "ServiceName", "wooriteam-service"]]
          period = 60, stat = "Average", view = "timeSeries"
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "ECS Memory Utilization"
          metrics = [["AWS/ECS", "MemoryUtilization",
            "ClusterName", "wooriteam-cluster",
            "ServiceName", "wooriteam-service"]]
          period = 60, stat = "Average", view = "timeSeries"
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "ALB 5xx Count"
          metrics = [["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count",
            "LoadBalancer", "<ALB_ARN_SUFFIX>"]]
          period = 60, stat = "Sum", view = "timeSeries"
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "ALB Response Time (p95)"
          metrics = [["AWS/ApplicationELB", "TargetResponseTime",
            "LoadBalancer", "<ALB_ARN_SUFFIX>"]]
          period = 60, stat = "p95", view = "timeSeries"
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "RDS CPU Utilization"
          metrics = [["AWS/RDS", "CPUUtilization",
            "DBInstanceIdentifier", "wooriteam-db"]]
          period = 60, stat = "Average", view = "timeSeries"
        }
      },
      {
        type = "metric", width = 8, height = 6,
        properties = {
          title  = "RDS Database Connections"
          metrics = [["AWS/RDS", "DatabaseConnections",
            "DBInstanceIdentifier", "wooriteam-db"]]
          period = 60, stat = "Average", view = "timeSeries"
        }
      }
    ]
  })
}
```

---

### 11-6. 모니터링 체크리스트 (`cloudwatch.tf` 작업 범위)

- [ ] 로그 그룹 3개 생성 (`/ecs/wooriteam`, `/ecs/wooriteam/access`, `/rds/wooriteam/slowquery`)
- [ ] ALB 액세스 로그용 S3 버킷 생성 + 수명주기 정책 (14일)
- [ ] SNS Topic `wooriteam-alerts` + 이메일 구독
- [ ] CloudWatch 알람 11개 생성
- [ ] Lambda 함수 `wooriteam-alert-notifier` 배포 (Python zip)
- [ ] SNS → Lambda 구독 + 실행 권한
- [ ] CloudWatch Dashboard `wooriteam-overview` 생성
- [ ] `variables.tf`에 `discord_webhook_url` 변수 추가
- [ ] Grafana Cloud 계정 생성 + CloudWatch 데이터소스 연결 (수동)
- [ ] Grafana IAM User `wooriteam-grafana` 생성 + 위 Policy 연결

---

## 12. Terraform 파일 구조 및 변수 명세

### 파일 구조

```
infra/
├── main.tf               # provider 설정, S3+DynamoDB 원격 state 백엔드
├── variables.tf          # 변수 선언
├── terraform.tfvars      # 실제 값 (gitignore 대상)
├── outputs.tf            # 출력값 정의
├── vpc.tf                # VPC, 서브넷, IGW, NAT GW, 라우팅 테이블
├── security_groups.tf    # alb-sg, ecs-sg, rds-sg
├── ecr.tf                # ECR 레포지토리 + 수명주기 정책
├── alb.tf                # ALB, 타겟 그룹, 리스너
├── ecs.tf                # ECS Cluster, Task Definition, Service, Auto Scaling
├── rds.tf                # RDS Instance, Subnet Group, Parameter Group
├── secrets.tf            # Secrets Manager 시크릿 정의
├── iam.tf                # Task Execution Role, CI/CD IAM User, Grafana IAM User, Lambda Role
├── cloudwatch.tf         # 로그 그룹, 알람 11개, SNS Topic, CloudWatch Dashboard
├── lambda.tf             # alert-notifier Lambda 함수 + SNS 구독
├── s3.tf                 # ALB 액세스 로그 버킷 + 프론트엔드 정적 호스팅 버킷(wooriteam-frontend)
├── cloudfront.tf         # CloudFront 배포, OAC, 캐시 정책/Behavior
└── route53.tf            # Route 53 Hosted Zone, A 레코드, ACM 인증서 (var.domain_name != "" 시 활성화)
```

> 커스텀 도메인은 MVP 이후 선택 사항이므로, ACM·Route 53 리소스는 `cloudfront.tf` 내부에서 `var.domain_name != ""` 같은 조건부(`count`)로 작성해 도메인 유무에 따라 켜고 끌 수 있게 한다.

### `main.tf` — Provider & Backend

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "wooriteam-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "wooriteam-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
```

### `variables.tf` — 변수 선언

```hcl
variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "프로젝트 이름 (리소스 이름 접두사)"
  type        = string
  default     = "wooriteam"
}

variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "퍼블릭 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "프라이빗 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_subnet_cidrs" {
  description = "DB 서브넷 CIDR 목록 [2a, 2c]"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "availability_zones" {
  description = "사용할 AZ 목록"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "ecs_task_cpu" {
  description = "ECS 태스크 CPU (단위: vCPU 단위)"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "ECS 태스크 메모리 (단위: MB)"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "ECS 서비스 원하는 태스크 수"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Auto Scaling 최소 태스크 수"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Auto Scaling 최대 태스크 수"
  type        = number
  default     = 6
}

variable "db_instance_class" {
  description = "RDS 인스턴스 클래스"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "MySQL 데이터베이스 이름"
  type        = string
  default     = "wooriteam"
}

variable "db_username" {
  description = "RDS 마스터 사용자명"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS 마스터 비밀번호"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT 서명 키"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "CloudWatch 알람 수신 이메일"
  type        = string
}

variable "ecr_image_uri" {
  description = "ECS Task Definition에 사용할 ECR 이미지 URI (CD에서 교체)"
  type        = string
  default     = ""
}

variable "discord_webhook_url" {
  description = "Discord 알림 Webhook URL"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "커스텀 도메인 (구매 전이면 빈 문자열 — Alias/ACM/Route 53 리소스를 count로 비활성화)"
  type        = string
  default     = ""
}

variable "cloudfront_origin_secret" {
  description = "CloudFront → ALB 커스텀 헤더 검증용 난수 값 (ALB 직접 접근 차단)"
  type        = string
  sensitive   = true
}
```

### `outputs.tf` — 출력값

```hcl
output "alb_dns_name" {
  description = "ALB DNS 이름 (서비스 접속 주소)"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR 레포지토리 URL (이미지 push 주소)"
  value       = aws_ecr_repository.main.repository_url
}

output "rds_endpoint" {
  description = "RDS 엔드포인트 (DB_HOST 환경변수 값)"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS 클러스터 이름"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS 서비스 이름"
  value       = aws_ecs_service.main.name
}

output "ecs_task_definition_arn" {
  description = "현재 등록된 Task Definition ARN"
  value       = aws_ecs_task_definition.main.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "nat_gateway_eip" {
  description = "NAT Gateway 고정 IP (아웃바운드 IP)"
  value       = aws_eip.nat.public_ip
}

output "cloudfront_domain_name" {
  description = "CloudFront 배포 도메인 — 커스텀 도메인 연결 전까지의 서비스 접속 주소이자 CORS_ALLOWED_ORIGINS 값"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront 배포 ID (CD에서 캐시 무효화 시 사용)"
  value       = aws_cloudfront_distribution.main.id
}

output "frontend_bucket_name" {
  description = "프론트엔드 빌드 산출물(dist) 업로드 대상 S3 버킷"
  value       = aws_s3_bucket.frontend.bucket
}
```

---

## 13. CI/CD 파이프라인 (GitHub Actions)

> 상세 워크플로 설계는 `cicd.md` 참고. 인프라 관점 요약만 기재.

### 워크플로 구조

| 파일 | 트리거 | 역할 |
|---|---|---|
| `.github/workflows/ci.yml` | PR 오픈·커밋 푸시 | 빌드 + 테스트 + JaCoCo 커버리지 검증 |
| `.github/workflows/cd.yml` | main 머지 (백엔드 변경) | Docker 빌드 + Trivy 스캔 + ECR 푸시 + ECS 배포 + 롤백 + Discord 알림 |
| `.github/workflows/cd-frontend.yml` | main 머지 (`frontend/**` 변경) | Vite 빌드 + S3 동기화 + CloudFront 캐시 무효화 + Discord 알림 |

> 프론트/백엔드 워크플로를 분리하면 `paths: ['frontend/**']` / `paths-ignore: ['frontend/**']` 조건으로 불필요한 배포를 막을 수 있다 (예: 프론트만 수정했는데 ECS가 재배포되는 일 방지).

### GitHub Secrets 목록

| Secret 이름 | 값 | 용도 |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `wooriteam-cicd` IAM 계정 | AWS 인증 |
| `AWS_SECRET_ACCESS_KEY` | `wooriteam-cicd` IAM 계정 | AWS 인증 |
| `AWS_REGION` | `ap-northeast-2` | AWS 리전 |
| `ECR_REPOSITORY` | ECR URL (`outputs.ecr_repository_url`) | 이미지 push 주소 |
| `ECS_CLUSTER` | `wooriteam-cluster` | 배포 대상 클러스터 |
| `ECS_SERVICE` | `wooriteam-service` | 배포 대상 서비스 |
| `ECS_TASK_DEFINITION` | `wooriteam-task` | Task Definition 이름 |
| `CONTAINER_NAME` | `wooriteam-app` | Task Definition 내 컨테이너 이름 |
| `ALB_DNS` | ALB DNS (`outputs.alb_dns_name`) | 스모크 테스트 엔드포인트 |
| `FRONTEND_S3_BUCKET` | 프론트 S3 버킷 (`outputs.frontend_bucket_name`) | `aws s3 sync` 업로드 대상 |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront 배포 ID (`outputs.cloudfront_distribution_id`) | 캐시 무효화(`create-invalidation`) 대상 |
| `DISCORD_WEBHOOK` | Discord Webhook URL | 배포 결과 알림 |

> `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`은 GitHub Secrets 등록 안 함. `CORS_ALLOWED_ORIGINS`은 `terraform.tfvars`/ECS 환경변수로, `DB_PASSWORD`·`JWT_SECRET`은 Secrets Manager → ECS Task Definition → 컨테이너로 주입한다.

---

## 14. 장애 시나리오 & 대응

| 시나리오 | 자동 대응 | 수동 확인 |
|---|---|---|
| ECS 태스크 1개 비정상 종료 | ECS 자동 재시작, ALB 정상 태스크로만 라우팅 | `/ecs/wooriteam` 로그에서 원인 확인 |
| AZ 전체 장애 | 나머지 AZ 태스크가 트래픽 수용, Auto Scaling 스케일 아웃 | ECS 콘솔 태스크 분포 확인 |
| RDS Primary 장애 | Multi-AZ Standby 자동 승격 (~1-2분), HikariCP 재연결 | RDS 콘솔 이벤트 탭 확인 |
| 배포 후 5xx 급증 | CloudWatch 알람 → SNS 이메일 알림 | ECS 콘솔에서 이전 Task Definition ARN으로 서비스 업데이트 |
| 메모리 부족 (OOMKilled) | ECS 태스크 재시작 | Task Definition `ecs_task_memory` 상향 후 재배포 |
| NAT Gateway 1개 장애 | 해당 AZ ECS만 아웃바운드 제한, 나머지 AZ는 정상 운영 | 장애 AZ NAT GW 재생성 또는 VPC Endpoint 전환 |

---

## 15. 비용 추정 (월)

| 서비스 | 사양 | 예상 비용 |
|---|---|---|
| ECS Fargate | 0.5vCPU × 1GB × 2태스크 × 720h | ~$15 |
| RDS MySQL | db.t3.micro Multi-AZ × 720h | ~$30 |
| ALB | 기본 + LCU | ~$20 |
| NAT Gateway | 2개 × 720h + 전송량 | ~$70 |
| ECR | 이미지 스토리지 | ~$1 |
| Secrets Manager | 3개 시크릿 | ~$2 |
| CloudWatch | 로그·알람·대시보드 | ~$8 |
| Lambda (알림) | 알람 발생 시만 실행, 무료 티어 내 | ~$0 |
| S3 (ALB 로그 + 프론트 정적 파일) | 14일 보존 + 수십 MB 정적 빌드 | ~$1 |
| CloudFront | 소규모 트래픽 (프리티어 1TB/월 전송 포함) | ~$1 |
| Route 53 (선택, 커스텀 도메인 구매 시) | Hosted Zone 1개 | ~$0.5 |
| Grafana Cloud | 프리티어 | $0 |
| **합계** | | **~$147~148/월** (커스텀 도메인 미구매 시 ~$147) |

> CloudFront·S3(프론트)·Route 53 추가로 인한 증분은 월 $2 내외로 미미하다 — 오히려 ALB가 정적 파일까지 처리하지 않아도 되고, S3+CloudFront 조합이 정적 자원 서빙에 더 비용 효율적이다.

**비용 절감 옵션** (추후 최적화):
- NAT Gateway → VPC Endpoint 전환 (ECR, S3, Secrets Manager, CloudWatch) 시 ~$20 절감 가능
- RDS Multi-AZ → Single-AZ 전환 시 ~$15 절감 (단, 장애 복구 시간 수동 개입 필요)