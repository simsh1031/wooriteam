# 우리팀 TODO

> 수정·추가가 필요한 사항을 우선순위별로 정리. 완료 시 `[x]`로 변경.

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

- [ ] `UserProfile` 엔티티 생성
  - 컬럼: `id`, `user_id` (FK → users, UNIQUE), `tech_stack`, `experience`, `is_public` (boolean, default false)
  - `User` ↔ `UserProfile` 1:1 연관관계 설정

### API

- [ ] `GET /api/my/profile` — 내 프로필 조회
- [ ] `PUT /api/my/profile` — 내 프로필 수정 (기술스택, 경험, 공개여부)
- [ ] `GET /api/users` — 공개 프로필 목록 조회 (회원 전용)
- [ ] `GET /api/users/{userId}` — 공개 프로필 상세 조회 (회원 전용)
- [ ] `GET /api/posts` 쿼리파라미터 확장
  - `difficulty` (Difficulty ENUM 필터)
  - `projectType` (ProjectType ENUM 필터)
  - `techStack` (PostRole.techStack 포함 여부 검색)
  - `keyword` (title·description 통합 키워드 검색)

---

## Could (3단계 이후)

### 엔티티 / DB

- [ ] `Post`에 `deadline` 컬럼 추가 (nullable, LocalDateTime)
- [ ] `Post`에 `group_id` 컬럼 추가 (nullable, FK → groups)
- [ ] `Group` 엔티티 생성
  - 컬럼: `id`, `owner_id` (FK → users), `name`, `description`, `created_at`
- [ ] `GroupMember` 엔티티 생성
  - 컬럼: `id`, `group_id` (FK → groups), `user_id` (FK → users), `status` (ENUM: PENDING·APPROVED), `joined_at`
- [ ] `Bookmark` 엔티티 생성
  - 컬럼: `id`, `user_id` (FK → users), `post_id` (FK → posts), `created_at`
  - `(user_id, post_id)` UNIQUE 제약
- [ ] `Report` 엔티티 생성
  - 컬럼: `id`, `reporter_id` (FK → users), `target_type` (ENUM: POST·USER), `target_id`, `reason`, `created_at`

### API

- [ ] `POST /api/posts/{postId}/bookmark` — 북마크 추가
- [ ] `DELETE /api/posts/{postId}/bookmark` — 북마크 삭제
- [ ] `GET /api/my/bookmarks` — 내 북마크 목록
- [ ] `GET /api/groups` — 그룹 목록 조회
- [ ] `POST /api/groups` — 그룹 생성
- [ ] `GET /api/groups/{groupId}` — 그룹 상세 조회
- [ ] `POST /api/groups/{groupId}/join` — 그룹 가입 신청
- [ ] `PATCH /api/groups/{groupId}/members/{userId}` — 가입 신청 승인/거절 (그룹장 전용)
- [ ] `POST /api/reports` — 신고 접수
- [ ] 공고 자동 마감 스케줄러 (deadline 기반 `@Scheduled`)

---

## 코드 품질 / 개선

- [ ] `GET /api/posts` 마감 공고 필터링 — PLAN.md는 마감 공고를 탭에서 기본 제외해야 함
  - `PostRepository.findAllWithRoles()`, `findByRoleType()` 쿼리에 `WHERE p.closed = false` 조건 추가 필요
- [ ] `Application.motivation`, `Application.contact`에 `@Column(nullable = false)` 추가
  - 현재 `ApplicationRequest`에서 `@NotBlank`로 검증하지만 DB 스키마에는 nullable로 되어 있음

---

## 서버 안정성 — 코드 레벨 (2단계, 배포 전 필수)

- [ ] `spring.jpa.hibernate.ddl-auto: update` → `validate` 변경
  - 프로덕션에서 Hibernate가 스키마를 자동 변경하지 못하도록 차단
  - Flyway 의존성 추가 후 `src/main/resources/db/migration/` 에 초기 스키마 SQL 작성
- [ ] Graceful Shutdown 설정 추가 (`application.yaml`)
  - `server.shutdown: graceful`
  - `spring.lifecycle.timeout-per-shutdown-phase: 30s`
  - ECS가 태스크 교체 시 SIGTERM을 보내면 진행 중인 요청을 완료 후 종료
- [ ] HikariCP 커넥션 풀 명시적 설정 (`application.yaml`)
  - `maximum-pool-size: 10`, `minimum-idle: 5`
  - `connection-timeout: 30000`, `validation-timeout: 5000`
  - RDS db.t3.micro 기본 커넥션 수(66개) 내에서 ECS 태스크 수 × 풀 크기 계산 필요
- [ ] Spring Actuator 헬스체크 엔드포인트 추가
  - `spring-boot-starter-actuator` 의존성 추가 (`build.gradle`)
  - `management.endpoints.web.exposure.include: health`
  - `management.endpoint.health.show-details: never`
  - ALB 타겟 그룹 헬스체크 경로: `GET /actuator/health`

---

## 인프라 / CI·CD (2단계)

### Terraform 구축 순서 (`infra/`)

> 설계서: `docs/infra-ecs.md` | 의존 관계 상 아래 순서대로 진행

**0단계 — 부트스트랩 (수동, `terraform init` 전 1회)**
- [ ] S3 버킷 생성: `wooriteam-tfstate` (ap-northeast-2, versioning 활성화)
- [ ] DynamoDB 테이블 생성: `wooriteam-tfstate-lock` (파티션 키: `LockID`, 타입: String)
- [ ] `terraform init` 실행 (S3 백엔드 연결 확인)

**1단계 — 기반 설정**
- [x] `infra/main.tf` — provider, S3 백엔드
- [x] `infra/variables.tf` — 전체 변수 선언
- [x] `infra/outputs.tf` — 출력값 (단계별 주석 처리)
- [ ] `terraform.tfvars` 실제 값 작성 (`terraform.tfvars.example` 참고, gitignore 대상)

**2단계 — 네트워크**
- [x] `infra/vpc.tf` — VPC, 서브넷 6개, IGW, NAT GW 2개, 라우팅 테이블 4개

**3단계 — 보안 그룹**
- [x] `infra/security_groups.tf` — alb-sg → ecs-sg → rds-sg

**4단계 — 독립 리소스**
- [ ] `infra/ecr.tf` — ECR 레포지토리 + 수명주기 정책
- [ ] `infra/secrets.tf` — Secrets Manager 시크릿 4개
- [ ] `infra/iam.tf` — Task Execution Role, CI/CD IAM User, Grafana IAM User, Lambda Role
- [ ] `infra/s3.tf` — ALB 로그 버킷 + 프론트엔드 정적 호스팅 버킷

**5단계 — 컴퓨팅 & DB**
- [ ] `infra/rds.tf` — RDS MySQL 8.0 Multi-AZ, Subnet Group, Parameter Group
- [ ] `infra/alb.tf` — ALB, 타겟 그룹, 리스너
- [ ] `infra/ecs.tf` — ECS Cluster, Task Definition, Service, Auto Scaling

**6단계 — CDN & DNS**
- [ ] `infra/cloudfront.tf` — CloudFront 배포, OAC, 캐시 Behavior
- [ ] `infra/route53.tf` — Hosted Zone, A 레코드, ACM 인증서 (도메인 구매 후)

**7단계 — 모니터링**
- [ ] `infra/cloudwatch.tf` — 로그 그룹, 알람 11개, SNS, Dashboard
- [ ] `infra/lambda.tf` — alert-notifier Lambda + SNS 구독

---

### CI/CD

- [ ] GitHub Actions CI 파이프라인 (빌드 → 테스트 → ECR 푸시)
- [ ] GitHub Actions CD 파이프라인 (ECS Fargate 롤링 배포)
  - `aws ecs update-service --force-new-deployment`
  - 배포 전 Flyway 마이그레이션 검증 단계 포함
- [ ] Secrets Manager에 JWT secret, DB 자격증명 등록
  - ECS Task Definition에서 `secrets` 블록으로 환경변수 주입 (코드에 하드코딩 금지)
- [ ] CloudWatch 알람 설정
  - ECS CPU > 70% / Memory > 80%
  - ALB 5xx 오류율 > 5% (5분 기준)
  - RDS 커넥션 수 > 50
- [ ] CloudWatch Logs 연동 (ECS Task Definition `awslogs` 드라이버)