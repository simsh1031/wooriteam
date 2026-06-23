# 배포 운영 문서 (GitHub Actions / CD)

> `infra/`에서 `terraform apply`로 인프라를 새로 만들거나 재생성한 뒤, GitHub Actions CD가 정상 동작하도록 맞춰주는 절차.
> Terraform 자체의 init/plan/apply/destroy 절차는 [`terraform-deploy.md`](./terraform-deploy.md) 참고.

---

## 1. terraform apply 후 GitHub Secrets 갱신 절차

`terraform apply`로 ALB, CloudFront, Secrets Manager, S3 등을 **재생성(= destroy 후 새 리소스 생성, in-place update 아님)**하면 AWS 리소스의 식별자(DNS, ID)가 바뀐다. GitHub Actions 워크플로(`cd.yml`, `cd-frontend.yml`)는 이 값을 GitHub Secrets에서 읽으므로, **시크릿이 옛 값으로 남아있으면 CD가 실패한다.**

### 증상

- `cd.yml` 스모크 테스트 단계: `curl ... ${{ secrets.ALB_DNS }}/actuator/health`가 10회×10초 재시도 후 실패 → 자동 롤백 발생
- `cd-frontend.yml` CloudFront 무효화 단계: `NoSuchDistribution` 에러로 실패

### 갱신해야 하는 시크릿과 출처

| Secret | terraform output 키 | 비고 |
|---|---|---|
| `ALB_DNS` | `alb_dns_name` | `cd.yml` 스모크 테스트 엔드포인트 |
| `CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id` | `cd-frontend.yml` 캐시 무효화 대상 |
| `FRONTEND_S3_BUCKET` | `frontend_bucket_name` | `cd-frontend.yml` S3 sync 대상 (버킷명에 계정ID 포함이라 보통 안 바뀜) |
| `CLOUDFRONT_ORIGIN_SECRET` | `terraform.tfvars`의 `cloudfront_origin_secret` | 값이 바뀐 게 아니라도, Secrets Manager가 재생성되며 GitHub Secret과 어긋났는지 확인 |

### 절차

1. terraform apply가 끝나면 변경된 출력값 확인

   ```bash
   cd infra
   terraform output
   ```

2. 위 표의 매핑에 따라 GitHub Secrets 갱신 (`gh` CLI 사용, 저장소 루트에서 실행)

   ```bash
   gh secret set ALB_DNS --body "$(terraform -chdir=infra output -raw alb_dns_name)"
   gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "$(terraform -chdir=infra output -raw cloudfront_distribution_id)"
   gh secret set FRONTEND_S3_BUCKET --body "$(terraform -chdir=infra output -raw frontend_bucket_name)"
   # gh secret set CLOUDFRONT_ORIGIN_SECRET --body "<terraform.tfvars의 cloudfront_origin_secret 값>"
   
   $secretMatch = Select-String -Path infra/terraform.tfvars -Pattern '^\s*cloudfront_origin_secret\s*=\s*"(.*)"\s*$'
   $cfSecret = $secretMatch.Matches[0].Groups[1].Value
   gh secret set CLOUDFRONT_ORIGIN_SECRET --body $cfSecret
   ```

3. 시크릿 갱신 후 실패했던 워크플로 재실행

   ```bash
   gh run rerun <run-id> --failed
   ```

> **체크리스트**: terraform apply로 ALB, CloudFront, Secrets Manager, S3 등을 재생성한 직후에는 항상 위 절차를 먼저 수행한 뒤 push/재실행할 것.

---

## 2. Secrets Manager "scheduled for deletion" 충돌

terraform destroy 후 같은 이름으로 시크릿을 다시 만들면 아래 오류가 발생할 수 있다 (기본 recovery window 때문에 즉시 삭제되지 않음).

```
InvalidRequestException: You can't create this secret because a secret with this name
is already scheduled for deletion.
```

### 해결

새로 생성하는 것이 목적이라면 완전 삭제 후 재생성:

```bash
aws secretsmanager delete-secret --secret-id wooriteam/prod/db-username --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/db-password --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/jwt-secret --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id wooriteam/prod/cloudfront-origin-secret --force-delete-without-recovery
```

이후 `terraform apply` 재실행.

> `terraform destroy` 직후 정리 절차는 [`terraform-deploy.md`](./terraform-deploy.md)의 "destroy 이후 정리" 섹션 참고.
