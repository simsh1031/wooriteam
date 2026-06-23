# 우리팀 TODO

> 수정·추가가 필요한 사항을 우선순위별로 정리. 완료 시 `[x]`로 변경.

---

## Git 작업 (즉시 해야 할 것)

- [x] `feature/infra-docs` 브랜치 생성 후 `infra/`, `docs/` 만 커밋 & 푸시
- [x] 기능 업데이트 전용 브랜치 생성 후 `src/`, `frontend/` 변경사항 커밋 & 푸시
  - 브랜치 예시: `feature/user-profile`
  - 포함 대상: UserProfile 엔티티, UserController, UserService, UserProfileRepository, ProfilesPage, ProfileDetailPage, SearchResultPage, TechStackSelector 등 신규·수정 파일 전체

---

## Must (MVP 필수) — 1단계 완료 ✅

- [x] 도메인·데이터 모델 설계 (User, Post, PostRole, Application)
- [x] 핵심 API 명세 (`docs/api-spec.md`)
- [x] 로컬 개발 환경 구축 (MySQL + bootRun + DB 확인)
- [x] Must 기능 백엔드 구현 (인증/공고 CRUD/지원/마이페이지)
- [x] Must 기능 프론트엔드 구현 (9개 페이지)
- [x] 로컬 E2E 검증

---

## Should (2단계 목표)

### 엔티티 / DB

- [x] `UserProfile` 엔티티 생성
  - 컬럼: `id`, `user_id` (FK → users, UNIQUE), `tech_stack`, `experience`, `is_public` (boolean, default false)
  - `User` ↔ `UserProfile` 1:1 연관관계 설정

### API

- [x] `GET /api/my/profile` — 내 프로필 조회
- [x] `PUT /api/my/profile` — 내 프로필 수정 (기술스택, 경험, 공개여부)
- [x] `GET /api/users` — 공개 프로필 목록 조회 (회원 전용)
- [x] `GET /api/users/{userId}` — 공개 프로필 상세 조회 (회원 전용)
- [x] `GET /api/posts` 쿼리파라미터 확장
  - `difficulty` (Difficulty ENUM 필터)
  - `projectType` (ProjectType ENUM 필터)
  - `techStack` (PostRole.techStack 포함 여부 검색)
  - `keyword` (title·description 통합 키워드 검색)

---

## Could (3단계 이후)

### 엔티티 / DB

- [x] `Post`에 `deadline` 컬럼 추가 (nullable, LocalDateTime)
- [x] `Post`에 `group_id` 컬럼 추가 (nullable, FK → groups)
- [x] `Group` 엔티티 생성
  - 컬럼: `id`, `owner_id` (FK → users), `name`, `description`, `created_at`
- [x] `GroupMember` 엔티티 생성
  - 컬럼: `id`, `group_id` (FK → groups), `user_id` (FK → users), `status` (ENUM: PENDING·APPROVED), `joined_at`
- [x] `Bookmark` 엔티티 생성
  - 컬럼: `id`, `user_id` (FK → users), `post_id` (FK → posts), `created_at`
  - `(user_id, post_id)` UNIQUE 제약
- [x] `Report` 엔티티 생성
  - 컬럼: `id`, `reporter_id` (FK → users), `target_type` (ENUM: POST·USER), `target_id`, `reason`, `created_at`

### API

- [x] `POST /api/posts/{postId}/bookmark` — 북마크 추가
- [x] `DELETE /api/posts/{postId}/bookmark` — 북마크 삭제
- [x] `GET /api/my/bookmarks` — 내 북마크 목록
- [x] `GET /api/groups` — 그룹 목록 조회
- [x] `POST /api/groups` — 그룹 생성
- [x] `GET /api/groups/{groupId}` — 그룹 상세 조회
- [x] `POST /api/groups/{groupId}/join` — 그룹 가입 신청
- [x] `PATCH /api/groups/{groupId}/members/{userId}` — 가입 신청 승인/거절 (그룹장 전용)
- [x] `POST /api/reports` — 신고 접수
- [x] 공고 자동 마감 스케줄러 (deadline 기반 `@Scheduled`)

---

## 코드 품질 / 개선

- [x] `GET /api/posts` 마감 공고 필터링 — PLAN.md는 마감 공고를 탭에서 기본 제외해야 함
  - `PostSpecification.withFilters()`에 `closed = false` 조건 적용됨 (`findAllWithRoles()`/`findByRoleType()` 대신 Specification 기반으로 전환)
- [x] `Application.motivation`, `Application.contact`에 `@Column(nullable = false)` 추가
  - 현재 `ApplicationRequest`에서 `@NotBlank`로 검증하지만 DB 스키마에는 nullable로 되어 있음

---

## 서버 안정성 — 코드 레벨 (2단계, 배포 전 필수)

- [ ] `spring.jpa.hibernate.ddl-auto: update` → `validate` 변경
  - 프로덕션에서 Hibernate가 스키마를 자동 변경하지 못하도록 차단
  - Flyway 의존성 추가 후 `src/main/resources/db/migration/` 에 초기 스키마 SQL 작성
- [x] Graceful Shutdown 설정 추가 (`application.yaml`)
  - `server.shutdown: graceful`
  - `spring.lifecycle.timeout-per-shutdown-phase: 30s`
  - ECS가 태스크 교체 시 SIGTERM을 보내면 진행 중인 요청을 완료 후 종료
- [x] HikariCP 커넥션 풀 명시적 설정 (`application.yaml`)
  - `maximum-pool-size: 10`, `minimum-idle: 5` (env `DB_POOL_MAX`/`DB_POOL_MIN_IDLE`로 오버라이드 가능)
  - `connection-timeout: 30000`, `validation-timeout: 5000`
  - RDS db.t3.micro 기본 커넥션 수(66개) 내에서 ECS 태스크 수 × 풀 크기 계산 필요
- [x] Spring Actuator 헬스체크 엔드포인트 추가
  - `spring-boot-starter-actuator` 의존성 추가 (`build.gradle`)
  - `management.endpoints.web.exposure.include: health`
  - `management.endpoint.health.show-details: never`
  - ALB 타겟 그룹 헬스체크 경로: `GET /actuator/health`

---

## 인프라 / CI·CD (2단계)

### Terraform 구축 순서 (`infra/`)

> 설계서: `docs/infra-ecs.md` | 의존 관계 상 아래 순서대로 진행

**0단계 — 부트스트랩 (수동, `terraform init` 전 1회)**
- [x] S3 버킷 생성: `wooriteam-tfstate` (ap-northeast-2, versioning 활성화)
- [x] DynamoDB 테이블 생성: `wooriteam-tfstate-lock` (파티션 키: `LockID`, 타입: String)
- [x] `terraform init` 실행 (S3 백엔드 연결 확인) — `infra/.terraform/terraform.tfstate`에 S3 백엔드 연동 확인됨

**1단계 — 기반 설정**
- [x] `infra/main.tf` — provider, S3 백엔드
- [x] `infra/variables.tf` — 전체 변수 선언
- [x] `infra/outputs.tf` — 출력값 (단계별 주석 처리)
- [x] `terraform.tfvars` 실제 값 작성 (`terraform.tfvars.example` 참고, gitignore 대상)

**2단계 — 네트워크**
- [x] `infra/vpc.tf` — VPC, 서브넷 6개, IGW, NAT GW 2개, 라우팅 테이블 4개

**3단계 — 보안 그룹**
- [x] `infra/security_groups.tf` — alb-sg → ecs-sg → rds-sg

**4단계 — 독립 리소스**
- [x] `infra/ecr.tf` — ECR 레포지토리 + 수명주기 정책
- [x] `infra/secrets.tf` — Secrets Manager 시크릿 4개
- [x] `infra/iam.tf` — Task Execution Role, CI/CD IAM User, Grafana IAM User, Lambda Role
- [x] `infra/s3.tf` — ALB 로그 버킷 + 프론트엔드 정적 호스팅 버킷

**5단계 — 컴퓨팅 & DB**
- [x] `infra/rds.tf` — RDS MySQL 8.0 Multi-AZ, Subnet Group, Parameter Group
- [x] `infra/alb.tf` — ALB, 타겟 그룹, 리스너
- [x] `infra/ecs.tf` — ECS Cluster, Task Definition, Service, Auto Scaling

**6단계 — CDN & DNS**
- [x] `infra/cloudfront.tf` — CloudFront 배포, OAC, 캐시 Behavior
- [x] `infra/route53.tf` — Hosted Zone, A 레코드, ACM 인증서 (도메인 구매 후)

**7단계 — 모니터링**
- [x] `infra/cloudwatch.tf` — 로그 그룹, 알람 11개, SNS, Dashboard
- [x] `infra/lambda.tf` — alert-notifier Lambda + SNS 구독

**8단계 — Grafana Cloud 연동 (모니터링, Should)**

> 상세 절차: `docs/infra.md` "11-3. Grafana Cloud 연동" 참고

- [x] `terraform apply`로 `wooriteam-grafana` IAM User(`infra/iam.tf`) 생성
- [x] Grafana Cloud 무료 계정 생성 + 스택 생성 (가입 시 자동 생성된 기본 스택 사용, 리전: 일본)
- [x] `wooriteam-grafana` IAM User의 Access Key 발급
- [x] Grafana Cloud > Connections > AWS > CloudWatch 데이터소스 연결 (Access Key, `ap-northeast-2`) — 절차·트러블슈팅은 `docs/grafana-deploy.md` 참고
- [x] 대시보드 import — 공개 대시보드(ECS `23`/RDS `707`/ALB `650`/CloudWatch Logs `13639`) 대신 ECS/ALB/RDS 커스텀 대시보드(`docs/grafana-dashboard.json`) 직접 구성해 import
- [ ] (선택) Discord Contact point 등록 + Alert rule 설정 (ECS CPU>80%, ALB 5xx>10건/분, RDS 커넥션>60개)

---

### CI/CD

- [x] GitHub Actions CI 파이프라인 (빌드 → 테스트 → ECR 푸시)
  - `.github/workflows/ci.yml` (빌드/테스트), `cd.yml`에서 ECR 푸시까지 포함
- [x] GitHub Actions CD 파이프라인 (ECS Fargate 롤링 배포)
  - `cd.yml` — Trivy 스캔, ECS 배포, 스모크 테스트, 실패 시 롤백, Discord 알림까지 구현
  - ⚠️ Flyway 마이그레이션 검증 단계는 미포함 (Flyway 자체가 아직 미도입 — 위 "서버 안정성" 항목 참고)
- [x] Secrets Manager에 JWT secret, DB 자격증명 등록
  - `infra/secrets.tf`에 시크릿 4개 정의, ECS Task Definition에서 주입
- [x] CloudWatch 알람 설정
  - `infra/cloudwatch.tf`에 알람 11개 정의 (ECS/ALB/RDS 포함)
- [x] CloudWatch Logs 연동 (ECS Task Definition `awslogs` 드라이버)
  - `infra/ecs.tf` logConfiguration에 적용됨

---

## 부하 테스트 (`terraform apply` 후 인프라 검증)

> 현재 스펙 기준: ECS 태스크 0.5 vCPU / 1GB × desired 2 (Auto Scaling 2~6), RDS `db.t3.micro` (최대 커넥션 ~66개), HikariCP `maximum-pool-size: 10`.
> 과도한 부하(수천 VU 등)는 비용·RDS 안정성 문제로 불필요 — Auto Scaling 트리거와 커넥션 풀 한도를 확인하는 수준이면 충분.

- [ ] 도구 선정: **k6** 설치 (CLI 기반, 스크립트 가볍고 ECS/RDS 부하 테스트에 적합 — JMeter보다 가벼움)
- [ ] 1단계 — 기본 동작 확인 (Smoke test)
  - VU 1~5, 30초, 주요 엔드포인트(`GET /api/posts`, `GET /actuator/health`) 호출해 200 응답 확인
- [ ] 2단계 — 평상시 부하 (Load test)
  - VU 20~30, 3~5분 유지, 응답 시간(p95) · 에러율 0% 확인
  - Grafana `wooriteam Infra (ECS/ALB/RDS)` 대시보드(`docs/grafana-dashboard.json`)의 ECS CPU/Memory 패널로 사용률 관찰
- [ ] 3단계 — 한계 테스트 (Stress test, Auto Scaling 트리거 확인용)
  - VU를 50 → 100까지 단계적(ramp-up)으로 증가, 5~10분
  - ECS Auto Scaling이 desired_count 2 → 6 사이에서 실제로 태스크를 늘리는지 확인 (`infra/ecs.tf` 스케일링 정책 기준)
  - RDS 커넥션 수가 HikariCP 풀 한도(`maximum-pool-size × 태스크 수`) 내에서 66개를 넘지 않는지 같은 대시보드의 RDS Database Connections 패널로 확인
- [ ] 4단계 — 스파이크 테스트 (선택)
  - 짧은 시간(10~30초) 동안 VU를 급격히 100까지 올렸다가 0으로 — ALB 5xx 알람·Discord 알림이 정상 동작하는지 확인
- [ ] 테스트 후 정리
  - Auto Scaling이 평상시 desired_count(2)로 다시 줄어드는지 확인 (scale-in 정책)
  - 부하테스트로 발생한 더미 데이터(Post/Application 등) 정리 또는 별도 테스트 계정으로 격리

---

## 남은 해야 할 일 (`docs/daily-log.md` 2026-06-22에서 이동)

> `terraform apply` 이후 진행할 작업

- [ ] `terraform apply` 실행 후 `terraform output`으로 `alb_dns_name`/`cloudfront_domain_name`/`rds_endpoint` 등 확인
- [ ] 배포 확인 — `/actuator/health` 200 응답 확인, 필요 시 `develop` 브랜치 push로 `cd.yml` CD 파이프라인 1회 실행해 최신 이미지 배포
- [x] Grafana 연동 마무리
  - [x] AWS 콘솔에서 `wooriteam-grafana` IAM User Access Key 발급
  - [x] Grafana Cloud Connections → AWS → CloudWatch 데이터소스 연결 (Access Key, `ap-northeast-2`)
  - [x] 대시보드 import — ECS/ALB/RDS 커스텀 대시보드(`docs/grafana-dashboard.json`)로 대체
  - [ ] (선택) Discord Contact point 등록 + Alert rule 설정
- [ ] k6 부하테스트 실행
  - [ ] `k6 run -e BASE_URL=<ALB/CloudFront 주소> k6/smoke.js`
  - [ ] `k6 run -e BASE_URL=... k6/load.js`
  - [ ] `k6 run -e BASE_URL=... k6/stress.js` (Grafana ECS/RDS 대시보드 같이 띄워놓고 Auto Scaling·커넥션 수 관찰)
- [ ] 부하테스트 후 정리
  - [ ] ECS Auto Scaling이 desired_count(2)로 scale-in 되는지 확인
  - [ ] `k6-load-test@wooriteam.test` 테스트 계정으로 생성된 더미 데이터 정리
  - [ ] `docs/todo.md`에 진행 결과 체크