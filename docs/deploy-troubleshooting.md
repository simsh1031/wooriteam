# 배포 트러블슈팅 기록

> 2026-06-23 배포 과정에서 발생한 CD 실패 사례와 원인·조치 정리. `gh-deploy.md`(시크릿 갱신 절차)와 함께 참고.

---

## 1. 프론트엔드 빌드 실패 — TS6133 (미사용 변수)

### 증상

```
Run npm run build
src/pages/MyPage.tsx(120,9): error TS6133: 'handleDelete' is declared but its value is never read.
Error: Process completed with exit code 2.
```

### 원인

`MyPage.tsx`에 공고 삭제 핸들러 `handleDelete`가 정의돼 있었지만, "내가 올린 공고" 카드 UI에 삭제 버튼이 연결되어 있지 않아 `tsc` 빌드(`noUnusedLocals` 계열 옵션)에서 미사용 변수로 잡힘.

### 조치

`mypost-actions` 영역에 삭제 버튼을 추가해 `handleDelete`를 실제로 연결 (`src/pages/MyPage.tsx`).

```tsx
{!post.closed && (
  <button onClick={() => handleClose(post.id)} className="btn btn-outline btn-sm">마감 처리</button>
)}
<button onClick={() => handleDelete(post.id)} className="btn btn-outline btn-sm">삭제</button>
```

---

## 2. 백엔드 테스트 실패 — JavaMailSender 빈 없음

### 증상

```
WooriteamApplicationTests > contextLoads() FAILED
Caused by: NoSuchBeanDefinitionException
No qualifying bean of type 'org.springframework.mail.javamail.JavaMailSender' available
```

### 원인

`EmailService`가 `JavaMailSender`를 생성자 주입받는데, `src/test/resources/application.yaml`에는 `spring.mail.host` 설정이 없었음. Spring Boot의 `MailSenderAutoConfiguration`은 `spring.mail.host`(또는 `jndi-name`) 프로퍼티가 존재해야 `JavaMailSender` 빈을 생성하므로, 테스트 컨텍스트에서는 빈 자체가 만들어지지 않아 `ApplicationContext` 로딩이 실패함.

### 조치

`src/test/resources/application.yaml`에 더미 mail 설정 추가:

```yaml
spring:
  mail:
    host: localhost
    port: 587
    username:
    password:

app:
  mail:
    enabled: false
```

---

## 3. `cd-frontend.yml` 실패 — CloudFront `NoSuchDistribution`

### 증상

```
Run aws cloudfront create-invalidation ...
Error: aws: [ERROR]: An error occurred (NoSuchDistribution) when calling the CreateInvalidation operation:
The specified distribution does not exist.
```

### 원인

`terraform apply`로 CloudFront(및 ALB, S3 등)를 재생성(destroy 후 재생성, in-place 아님)하면서 배포 ID가 바뀌었는데, GitHub Secret `CLOUDFRONT_DISTRIBUTION_ID`는 옛 값으로 남아 있었음.

### 조치

`gh-deploy.md`의 절차대로 terraform output 기준으로 시크릿 갱신 (저장소 루트에서 실행).

PowerShell (Windows):

```powershell
gh secret set ALB_DNS --body (terraform -chdir=infra output -raw alb_dns_name)
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body (terraform -chdir=infra output -raw cloudfront_distribution_id)
gh secret set FRONTEND_S3_BUCKET --body (terraform -chdir=infra output -raw frontend_bucket_name)

$secretMatch = Select-String -Path infra/terraform.tfvars -Pattern '^\s*cloudfront_origin_secret\s*=\s*"(.*)"\s*$'
$cfSecret = $secretMatch.Matches[0].Groups[1].Value
gh secret set CLOUDFRONT_ORIGIN_SECRET --body $cfSecret
```

> PowerShell에서는 bash의 `$(...)` 대신 `(...)`를 쓰고, `grep`/`sed`가 없으므로 `Select-String` + 정규식 그룹으로 대체.

---

## 4. `cd.yml` 스모크 테스트 실패 — curl exit code 6 (host 미해석)

### 증상

```
Attempt 10: status=000, retrying...
Smoke test failed
Error: Process completed with exit code 6.
```

종료 코드 `6`은 curl의 `CURLE_COULDNT_RESOLVE_HOST` — 즉 `ALB_DNS` 시크릿이 가리키는 호스트명 자체가 존재하지 않음.

### 원인

GitHub Actions는 **워크플로 잡이 시작되는 시점**의 시크릿 값을 사용한다. 문제의 런(`27994029656`, `00:41:10Z` 시작)은 `ALB_DNS` 시크릿을 갱신(`00:49:28Z`)하기 *전에* 이미 트리거되어, 이미 destroy된 옛 ALB DNS를 그대로 사용했음 → DNS resolve 자체가 실패.

### 조치

별도 수정 불필요. 시크릿 갱신 **이후**에 새로 트리거된 런은 정상적으로 새 값을 사용함. (시크릿을 갱신한 직후라면, 이미 진행 중이던 옛 런의 실패는 무시하고 새 푸시/재실행 결과를 확인하면 됨.)

> terraform apply로 ALB/CloudFront 등을 재생성한 직후에는 **반드시 시크릿부터 갱신한 뒤** push/재실행할 것 (`gh-deploy.md` 체크리스트 참고).

---

## 5. ECS 로그 — Mail health check 인증 실패 (`/actuator/health` DOWN 유발)

### 증상

ECS 컨테이너 로그에 반복 출력:

```
WARN ... o.s.b.actuate.mail.MailHealthIndicator : Mail health check failed
jakarta.mail.AuthenticationFailedException: failed to connect, no password specified?
```

### 원인

`JavaMailSender` 빈이 존재하면 Spring Boot Actuator가 `MailHealthIndicator`를 자동 등록해 **메일 서버 연결 자체를 헬스체크**한다. 운영 환경에 `MAIL_USERNAME`/`MAIL_PASSWORD`가 설정되어 있지 않아(메일 발송은 `app.mail.enabled=false`로 꺼져 있을 뿐) 이 인디케이터가 계속 인증 실패를 일으키고, 그 결과가 `/actuator/health`의 전체 status를 `DOWN`으로 끌어내릴 수 있음. 이는 ALB 헬스체크·CD 스모크 테스트가 영구적으로 실패하는 잠재 원인이 된다.

### 조치

메일 발송 여부와 헬스체크를 분리 — `application.yaml`에 메일 헬스 인디케이터 비활성화 추가:

```yaml
management:
  endpoint:
    health:
      show-details: never
  health:
    mail:
      enabled: false
```

---

## 체크리스트 — terraform apply 직후 / 배포 실패 시

1. `terraform -chdir=infra output` 으로 최신 출력값 확인
2. `ALB_DNS`, `CLOUDFRONT_DISTRIBUTION_ID`, `FRONTEND_S3_BUCKET`, `CLOUDFRONT_ORIGIN_SECRET` GitHub Secrets 갱신 (`gh secret set`)
3. 시크릿 갱신 **이후** 새로 트리거된 런인지 확인 (옛 런이 실패했다면 시간 순서만 확인하고 무시)
4. ECS 로그에서 `/actuator/health` 관련 WARN/ERROR 확인 — 헬스 인디케이터가 의도와 무관하게 DOWN을 유발하는지 점검
5. 로컬에서 `./gradlew build`, `npm run build` 먼저 통과시켜 컴파일/테스트 단계 실패를 CD 이전에 걸러낼 것
