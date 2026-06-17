# Terraform 배포/정리 가이드

> `infra/`의 Terraform으로 AWS 인프라를 생성·삭제하는 전체 절차. GitHub Actions CD 연동(시크릿 갱신 등)은 [`gh-deploy.md`](./gh-deploy.md) 참고.

---

## 0. State 백엔드 부트스트랩 (최초 1회)

`infra/main.tf`의 `backend "s3"`가 참조하는 S3 버킷(`wooriteam-tfstate`)과 DynamoDB 락 테이블(`wooriteam-tfstate-lock`)은 Terraform이 관리하지 않으므로, `terraform init` 전에 직접 만들어야 한다.

```bash
# S3 버킷 (Terraform state 저장)
aws s3api create-bucket --bucket wooriteam-tfstate --region ap-northeast-2 --create-bucket-configuration LocationConstraint=ap-northeast-2
aws s3api put-bucket-versioning --bucket wooriteam-tfstate --versioning-configuration Status=Enabled

# DynamoDB (state 잠금용)
aws dynamodb create-table --table-name wooriteam-tfstate-lock --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region ap-northeast-2
```

> 한 번 만들면 계속 재사용한다 — 아래 1~3단계(인프라 생성/삭제)를 반복해도 이 부트스트랩 리소스는 유지한다. 프로젝트를 완전히 종료할 때만 [4단계](#4-완전-종료-시-state-백엔드-자체-정리)에서 정리한다.

---

## 1. terraform init / plan / apply

```bash
cd infra

terraform init      # S3 백엔드 연결 확인
terraform plan      # 생성될 리소스 미리 확인 (실제 변경 없음)
terraform apply     # 실제 생성 (yes 입력)
```

- `terraform.tfvars`(민감 값 포함)가 없다면 `terraform.tfvars.example`을 복사해 채워야 한다.
- apply 완료 후에는 [`gh-deploy.md`](./gh-deploy.md)의 "1. terraform apply 후 GitHub Secrets 갱신 절차"를 진행해 CD 파이프라인이 새 리소스 식별자를 바라보도록 갱신한다.

---

## 1-1. 목업 데이터 삽입 (선택)

`terraform apply` 후 테스트용 초기 데이터를 RDS에 넣고 싶을 때 실행한다.

> **실행 타이밍**: ECS 서비스가 기동되어 Spring Boot가 `ddl-auto: update`로 테이블을 생성한 **이후** 실행해야 한다. 테이블이 없으면 삽입 실패.

```bash
# 프로젝트 루트에서 실행
bash scripts/seed-rds.sh
```

스크립트가 자동으로 처리하는 것들:

| 단계 | 내용 |
|---|---|
| Terraform output | RDS 엔드포인트·클러스터·S3 버킷 조회 |
| Secrets Manager | DB 자격증명 조회 (`wooriteam/prod/db-*`) |
| S3 임시 업로드 | `docs/mock-data.sql` → S3, 사전 서명 URL(1시간) 발급 |
| Fargate 태스크 | `alpine:3.19` 이미지로 VPC 내부에서 mysql-client 실행 |
| 자동 정리 | 완료 후 임시 태스크 정의·S3 파일 삭제 |

> **왜 Fargate 태스크인가**: RDS가 `publicly_accessible = false`이고 DB 서브넷은 인터넷 라우팅이 없어 로컬에서 직접 접속할 수 없다. ECS SG → RDS SG 경로(3306)를 통해 VPC 내부에서만 접근 가능하므로, 동일 SG를 쓰는 일회용 Fargate 태스크로 우회한다.

실패 시 CloudWatch 로그 확인:

```bash
# 로그 그룹: /ecs/wooriteam  스트림 prefix: db-seed
aws logs tail /ecs/wooriteam --log-stream-name-prefix db-seed --region ap-northeast-2
```

삽입되는 데이터 요약: 사용자 5명, 공고 7개(1개 마감), 역할 19개, 지원 10건. 초기 비밀번호는 모두 `password`. 상세 내용은 `docs/mock-data.sql` 참고.

---

## 2. terraform destroy 전 정리

`terraform destroy`는 비어있지 않은 S3 버킷·ECR 레포지토리를 삭제하지 못하고 실패한다 (`BucketNotEmpty`, `RepositoryNotEmptyException`). CD가 이미지를 push했거나 프론트엔드를 배포한 적이 있다면 destroy 전에 먼저 비워야 한다.

### ECR 이미지 비우기

```bash
aws ecr list-images --repository-name wooriteam --region ap-northeast-2 --query 'imageIds[*]' --output json > /tmp/wooriteam-images.json
aws ecr batch-delete-image --repository-name wooriteam --region ap-northeast-2 --image-ids file:///tmp/wooriteam-images.json
```

### 프론트엔드 S3 버킷 비우기

```bash
aws s3 rm s3://$(terraform -chdir=infra output -raw frontend_bucket_name) --recursive
```

> ALB 액세스 로그 버킷(`wooriteam-alb-logs-<계정ID>`)은 `force_destroy = true`로 설정되어 있어 별도로 비우지 않아도 destroy 시 자동 삭제된다.

---

## 3. terraform destroy

```bash
cd infra
terraform destroy   # yes 입력
```

### RDS 관련 주의

`infra/rds.tf`는 `deletion_protection = false`, `skip_final_snapshot = true`로 설정되어 있어 추가 조치 없이 destroy로 삭제된다 (과거 `deletion_protection = true`였을 때는 destroy가 막혀 먼저 `terraform apply -target=...`으로 옵션을 바꿔줘야 했음).

---

## 4. destroy 이후 정리

### Secrets Manager 강제 삭제 (재배포 예정 시)

`terraform destroy`로 삭제된 Secrets Manager 시크릿은 기본 recovery window(7~30일) 동안 "scheduled for deletion" 상태로 남아있어, 같은 이름으로 곧바로 다시 `terraform apply`하면 `InvalidRequestException`이 발생한다. 곧 재배포할 계획이라면 즉시 완전 삭제한다.

```bash
aws secretsmanager delete-secret --secret-id wooriteam/prod/db-username --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/db-password --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/jwt-secret --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/cloudfront-origin-secret --force-delete-without-recovery
```

> 자세한 에러 메시지·배경은 [`gh-deploy.md`](./gh-deploy.md)의 "2. Secrets Manager scheduled for deletion 충돌" 참고.

---

## 5. 완전 종료 시 — state 백엔드 자체 정리

프로젝트를 완전히 정리하고 [0단계](#0-state-백엔드-부트스트랩-최초-1회)의 부트스트랩 리소스까지 없애려면:

1. **S3 버킷(`wooriteam-tfstate`) 내용 비우기** — 버저닝이 켜져 있어 일반 객체뿐 아니라 모든 버전·삭제 마커까지 지워야 버킷을 삭제할 수 있다. CLI로 버전별 삭제를 처리하기보다 **AWS 콘솔에서 버킷을 비운 뒤 삭제하는 것이 더 쉽다.**

2. **DynamoDB 테이블 삭제**

   ```bash
   aws dynamodb delete-table --table-name wooriteam-tfstate-lock --region ap-northeast-2
   ```

> 이 단계 이후에는 [0단계](#0-state-백엔드-부트스트랩-최초-1회)부터 다시 수행해야 `terraform init`이 가능하다.
