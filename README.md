# 우리팀 (wooriteam)

팀 프로젝트 구인을 위한 역할 중심 구인 플랫폼

---

## 목차

1. [서비스 개요](#서비스-개요)
2. [실행 방법](#실행-방법)
3. [기술 스택](#기술-스택)
4. [프로젝트 구조](#프로젝트-구조)
5. [구동 원리](#구동-원리)
6. [클라우드 인프라](#클라우드-인프라)
7. [CI/CD](#cicd)
8. [API 목록](#api-목록)

---

## 서비스 개요

에브리타임·오픈카톡 등 비공식 채널에 흩어져 있던 팀 프로젝트 구인을 **역할(백엔드/프론트엔드/디자인/기획) 탭** 단위로 모아 게시·열람·지원할 수 있게 만든 플랫폼입니다.

### 타깃 사용자

- 졸업작품·전공 수업·해커톤·사이드프로젝트 팀원을 모집·탐색하는 **전공 대학생** (1순위)
- 포트폴리오용 프로젝트로 실전 협업 경험을 쌓으려는 **대학생**
- 부트캠프 수료 후 협업 경험을 원하는 **비전공자**
- 동아리·학교 단위로 소규모 팀을 구성하려는 **그룹 운영자**

기존 구인 채널은 공고가 프로젝트 단위로만 올라와 원하는 역할만 골라보기 어렵고, 현업자·경력자 중심의 분위기가 강해 진입 장벽이 높았습니다. 전공 지식을 실제 프로젝트에 적용해볼 팀을 찾는 전공 대학생을 우선 대상으로, 역할 탭과 난이도 태그로 원하는 포지션·수준의 팀을 빠르게 찾을 수 있도록 하는 것이 핵심 컨셉입니다.

### 주요 기능

- **역할 탭 분류**: 하나의 공고(`Post`)가 여러 역할(`PostRole`)을 가질 수 있고, 각 역할 탭에 동시 노출됩니다.
- **모집공고 CRUD + 마감 처리**: 작성자만 수정·삭제·마감 가능. 난이도·기술스택·프로젝트유형 필터와 키워드 검색을 제공합니다.
- **역할별 지원**: 비회원도 공고를 열람할 수 있지만 지원은 회원만 가능합니다. 지원자 목록은 게시자만 조회하며, 지원자는 본인 지원서를 수정·철회(소프트 삭제)할 수 있습니다.
- **공고 북마크**: 관심 있는 공고를 마이페이지에 저장해두고 다시 찾아볼 수 있습니다.
- **그룹 기능**: 그룹을 생성·가입 신청하고, 그룹 소속으로만 공고를 모집·열람할 수 있습니다. 그룹장은 가입 신청을 승인·관리합니다.
- **회원 프로필 공개**: 기술 스택·경력 구분을 담은 프로필을 공개해 다른 회원이 프로필 목록에서 찾아 컨택할 수 있습니다.
- **신고 기능**: 공고·회원에 대한 신고를 비회원도 제출할 수 있습니다.
- **회원/마이페이지**: 회원가입·로그인·로그아웃·탈퇴·비밀번호 변경, 내가 올린 공고·지원한 공고·북마크·소속 그룹 목록을 관리합니다.

상세 기획은 `docs/PLAN.md`, ERD는 `docs/ERD.md`, API 명세는 `docs/api-spec.md`를 참고하세요.

---

## 실행 방법

### 사전 요구사항

| 도구 | 버전 |
|---|---|
| Java | 17 이상 |
| MySQL | 8.0 이상 |
| Node.js | 18 이상 |

### 1. MySQL 데이터베이스 생성

```sql
CREATE DATABASE IF NOT EXISTS wooriteam
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. 환경변수 설정 (`.env`)

프로젝트 루트의 `.env` 파일을 본인 환경에 맞게 수정합니다.

```env
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=wooriteam-local-secret-key-change-this-in-production
```

### 3. 백엔드 실행

```bash
# 프로젝트 루트에서
./gradlew bootRun
```

- 기본 포트: **8080**
- 첫 실행 시 JPA `ddl-auto: update` 설정으로 테이블이 자동 생성됩니다.

### 4. 프론트엔드 실행

```bash
# 별도 터미널에서
cd frontend
npm install   # 최초 1회
npm run dev
```

- 기본 포트: **5173**
- 브라우저에서 `http://localhost:5173` 접속

### 5. 빌드 (배포용)

```bash
# 백엔드
./gradlew build

# 프론트엔드
cd frontend
npm run build   # dist/ 폴더에 정적 파일 생성
```

### 6. 클라우드 배포 관련 문서

로컬 실행과 별개로, AWS 인프라 구축·배포 운영은 목적에 따라 아래 문서를 참고하세요.

| 목적 | 문서 |
|---|---|
| 인프라 설계 전체를 이해하고 싶을 때 (현재 적용된 ECS 구조) | [`docs/infra.md`](./docs/infra.md) (= [`docs/infra-ecs.md`](./docs/infra-ecs.md)) |
| Terraform으로 인프라를 처음 생성/삭제할 때 | [`docs/terraform-deploy.md`](./docs/terraform-deploy.md) |
| `terraform apply`로 리소스가 재생성된 뒤 GitHub Secrets를 갱신할 때 | [`docs/gh-deploy.md`](./docs/gh-deploy.md) |
| CI/CD 배포가 실패했을 때 원인을 찾을 때 | [`docs/deploy-troubleshooting.md`](./docs/deploy-troubleshooting.md) |
| Grafana Cloud로 모니터링 대시보드를 구성할 때 | [`docs/grafana-deploy.md`](./docs/grafana-deploy.md) |
| ECS 대신 EKS(Kubernetes)로 전환을 검토할 때 (현재 미적용 대안 설계) | [`docs/infra-eks.md`](./docs/infra-eks.md) |

---

## 기술 스택

### 백엔드

| 구분 | 기술 |
|---|---|
| 언어/프레임워크 | Java 17, Spring Boot 3.5 |
| 인증 | Spring Security + JWT (jjwt 0.12.3) |
| ORM | Spring Data JPA (Hibernate) |
| DB | MySQL 8.0 |
| 유효성 검증 | Spring Validation |
| 환경변수 | spring-dotenv |
| 빌드 도구 | Gradle |

### 프론트엔드

| 구분 | 기술 |
|---|---|
| 언어/프레임워크 | TypeScript, React 19 |
| 빌드 도구 | Vite |
| 라우팅 | React Router v7 |
| HTTP 클라이언트 | axios |
| 스타일링 | CSS (CSS 변수 기반 디자인 시스템) |

---

## 프로젝트 구조

```
wooriteam/
├── src/main/java/wooriteam/
│   ├── config/
│   │   └── SecurityConfig.java       # Spring Security + CORS + 경로별 인증 정책
│   ├── security/
│   │   ├── JwtProvider.java          # JWT 생성·검증
│   │   ├── JwtAuthenticationFilter.java  # 요청마다 JWT 파싱
│   │   ├── LoginRateLimitFilter.java # 로그인 시도 횟수 제한
│   │   ├── TokenBlacklistService.java # 로그아웃/탈퇴 토큰 무효화
│   │   ├── CustomUserDetails.java    # Spring Security 사용자 정보
│   │   └── CustomUserDetailsService.java
│   ├── entity/
│   │   ├── User.java                 # 회원
│   │   ├── UserProfile.java          # 공개 프로필 (기술스택·경력)
│   │   ├── Post.java                 # 모집공고
│   │   ├── PostRole.java             # 공고별 모집 역할
│   │   ├── Application.java          # 지원 정보
│   │   ├── Bookmark.java             # 관심 공고 북마크
│   │   ├── Group.java                # 소속 그룹
│   │   ├── GroupMember.java          # 그룹 멤버·가입 신청
│   │   └── Report.java               # 신고/스팸
│   ├── enums/
│   │   ├── RoleType.java             # BACKEND | FRONTEND | DESIGN | PLANNING
│   │   ├── Difficulty.java           # BEGINNER | INTERMEDIATE | ADVANCED
│   │   ├── ProjectType.java          # SIDE_PROJECT | GRADUATION | ...
│   │   ├── CareerType.java           # 경력 구분
│   │   └── GroupMemberStatus.java    # PENDING | APPROVED
│   ├── repository/                   # JPA Repository 인터페이스
│   ├── service/
│   │   ├── AuthService.java          # 회원가입·로그인·탈퇴
│   │   ├── UserService.java          # 공개 프로필 목록·상세
│   │   ├── PostService.java          # 공고 CRUD·마감·검색
│   │   ├── ApplicationService.java   # 지원 제출·조회·수정·철회
│   │   ├── BookmarkService.java      # 공고 북마크
│   │   ├── GroupService.java         # 그룹 생성·가입·승인·조회
│   │   ├── ReportService.java        # 신고 접수
│   │   ├── MyPageService.java        # 내 공고·지원·프로필·비밀번호
│   │   └── EmailService.java         # 이메일 발송
│   ├── controller/
│   │   ├── AuthController.java       # /api/auth/**
│   │   ├── UserController.java       # /api/users/** (공개 프로필)
│   │   ├── PostController.java       # /api/posts/** (+ 북마크)
│   │   ├── ApplicationController.java# /api/posts/{id}/applications/**
│   │   ├── GroupController.java      # /api/groups/**
│   │   ├── ReportController.java     # /api/reports
│   │   └── MyPageController.java     # /api/my/**
│   ├── dto/
│   │   ├── request/                  # 클라이언트 → 서버 입력 데이터
│   │   └── response/                 # 서버 → 클라이언트 출력 데이터
│   ├── common/
│   │   └── ApiResponse.java          # 공통 응답 래퍼 { success, data, message }
│   └── exception/
│       ├── ErrorCode.java            # 에러 코드 + HTTP 상태 정의
│       ├── CustomException.java
│       └── GlobalExceptionHandler.java
│
├── src/main/resources/
│   ├── application.yaml             # DB·JPA·JWT 기본 설정
│   └── application-prod.yaml        # 운영 프로필 (RDS·HikariCP·Graceful Shutdown)
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # axios 인스턴스 (JWT 자동 첨부)
│   │   │   ├── types.ts             # 공유 타입 정의
│   │   │   ├── auth.ts              # 인증 API 함수
│   │   │   ├── posts.ts             # 공고·북마크 API 함수
│   │   │   ├── applications.ts      # 지원 API 함수
│   │   │   ├── profiles.ts          # 공개 프로필 API 함수
│   │   │   ├── groups.ts            # 그룹 API 함수
│   │   │   └── reports.ts           # 신고 API 함수
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # 로그인 상태 전역 관리
│   │   ├── components/
│   │   │   ├── Header.tsx / Footer.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── TechStackSelector.tsx
│   │   │   ├── SelectDropdown.tsx
│   │   │   └── DateInput.tsx
│   │   ├── pages/
│   │   │   ├── MainPage.tsx / LoginPage.tsx / SignupPage.tsx
│   │   │   ├── PostListPage.tsx     # 역할 탭별 공고 목록
│   │   │   ├── PostDetailPage.tsx / PostFormPage.tsx
│   │   │   ├── ApplyPage.tsx / ApplicantsPage.tsx
│   │   │   ├── SearchResultPage.tsx
│   │   │   ├── ProfilesPage.tsx / ProfileDetailPage.tsx
│   │   │   ├── GroupListPage.tsx / GroupDetailPage.tsx / GroupFormPage.tsx / GroupApplyPage.tsx
│   │   │   ├── ReportPage.tsx
│   │   │   └── MyPage.tsx
│   │   ├── App.tsx                  # 라우팅 정의
│   │   └── index.css                # CSS 변수·공통 스타일
│   └── vite.config.ts               # Vite 설정 (API 프록시 포함)
│
├── infra/                            # Terraform IaC (AWS ECS 기반, docs/infra.md 12번 참고)
├── .github/workflows/                # ci.yml, cd.yml, cd-frontend.yml
├── .env                               # 환경변수 (DB·JWT 비밀키)
├── build.gradle                      # 백엔드 의존성
└── docs/                              # PLAN, ERD, API 명세, 인프라·CI/CD·배포 운영 문서
```

---

## 구동 원리

### 전체 흐름 (로컬 개발)

```
브라우저(localhost:5173)
    ↓  정적 파일 (HTML/JS/CSS)
Vite Dev Server
    ↓  /api/* 요청을 프록시
Spring Boot Server(localhost:8080)
    ↓  JPA
MySQL(localhost:3306/wooriteam)
```

개발 환경에서 프론트엔드는 Vite가 서빙하고, `/api`로 시작하는 요청은 자동으로 백엔드 8080 포트로 전달합니다. 덕분에 CORS 문제 없이 같은 출처로 통신하는 것처럼 동작합니다.

### 서비스 → 인프라 배포 흐름 (운영)

로컬에서 동작하는 위 구조가 운영 환경에서는 그대로 클라우드 인프라로 대체됩니다. 코드 푸시부터 실제 서비스 반영까지의 전체 흐름은 다음과 같습니다.

```
개발자 main 브랜치 push
        │
        ▼
GitHub Actions (CI/CD) ──┬─ 백엔드 변경 ─▶ Docker 빌드 → ECR 푸시 → ECS 롤링 배포
                          └─ 프론트 변경 ─▶ Vite 빌드 → S3 동기화 → CloudFront 캐시 무효화
        │
        ▼
사용자 브라우저 ──▶ CloudFront(단일 도메인)
                     ├── 기본 경로(*)  ──▶ S3 (프론트 정적 파일)
                     └── /api/*       ──▶ ALB ──▶ ECS Fargate(Spring Boot) ──▶ RDS MySQL
```

즉, "Vite Dev Server + Spring Boot 8080"으로 로컬에서 검증한 동일한 프론트/백엔드 분리 구조가, 운영에서는 "S3+CloudFront / ALB+ECS"로 그대로 옮겨지고, 그 전환 작업(빌드·배포)을 GitHub Actions가 자동으로 수행합니다. 인프라 구성의 상세는 [클라우드 인프라](#클라우드-인프라), 배포 자동화 상세는 [CI/CD](#cicd) 섹션을 참고하세요.

### 인증 흐름 (JWT)

```
1. POST /api/auth/login
   → 서버가 이메일·비밀번호 검증 후 JWT 발급
   → 클라이언트는 localStorage에 토큰 저장

2. 이후 모든 인증 필요 요청
   → axios 인터셉터가 헤더에 자동으로 토큰 첨부
      Authorization: Bearer <token>

3. 백엔드 JwtAuthenticationFilter
   → 요청마다 토큰 파싱 → TokenBlacklistService로 로그아웃/탈퇴된 토큰인지 확인
   → 유효하면 SecurityContext에 사용자 정보 등록
   → 컨트롤러에서 @AuthenticationPrincipal로 현재 사용자 접근

4. 로그인 시도 과다 시
   → LoginRateLimitFilter가 일정 횟수 초과 요청을 차단

5. 토큰 만료(401) 시
   → axios 인터셉터가 localStorage 토큰 삭제 후 /login으로 리다이렉트
```

### 공고-역할-그룹 관계

하나의 공고(`Post`)는 여러 역할(`PostRole`)을 가질 수 있고, 선택적으로 그룹(`Group`)에 소속될 수 있습니다.
역할 탭 필터링은 PostRole 테이블을 JOIN해서 해당 역할이 있는 공고만 조회합니다.

```
Group (0..1) ─── (N) Post (1) ────── (N) PostRole
                    └── title              └── roleType (BACKEND | FRONTEND | DESIGN | PLANNING)
                    └── description        └── description
                    └── is_closed           └── techStack
```

지원(`Application`)은 공고와 역할을 모두 참조합니다. 어떤 역할로 지원했는지 저장하고, 중복 지원은 `(post, role, user)` 조합으로 방지합니다.

### 권한 구조

`SecurityConfig`의 경로 매칭으로 1차 인증 여부를 가르고, 게시자/그룹장 등 소유권 검증은 각 서비스 레이어에서 수행합니다.

| 기능 | 비회원 | 회원 | 게시자 / 그룹장 |
|---|---|---|---|
| 공고 목록·상세 조회, 검색 | ✅ | ✅ | ✅ |
| 공고 작성 | ❌ | ✅ | ✅ |
| 공고 수정·삭제·마감 | ❌ | ❌ | ✅ (작성자) |
| 지원 제출 / 내 지원 조회·수정·철회 | ❌ | ✅ | ✅ |
| 지원자 목록 조회 | ❌ | ❌ | ✅ (게시자) |
| 공고 북마크 추가/삭제 | ❌ | ✅ | ✅ |
| 공개 프로필 목록·상세 조회 | ❌ | ✅ | ✅ |
| 신고 제출 | ✅ | ✅ | ✅ |
| 그룹 목록 조회 | ❌ | ✅ | ✅ |
| 그룹 생성 / 가입 신청 | ❌ | ✅ | ✅ |
| 그룹 가입 승인·멤버 제외 | ❌ | ❌ | ✅ (그룹장) |
| 내 공고·지원·북마크·그룹·프로필 관리, 비밀번호 변경 | ❌ | ✅ | ✅ |

---

## 클라우드 인프라

AWS 위에 Terraform으로 구성된 운영 환경입니다(설계 상세: `docs/infra.md`, 코드: `infra/`). 프론트엔드(S3 정적 파일)와 백엔드(ECS API)를 **CloudFront 단일 도메인**으로 통합 노출합니다.

```
사용자
  │
  ▼
CloudFront (OAC)
  ├── 기본 동작 ─────────────▶ S3 (프론트엔드 정적 파일, wooriteam-frontend-*)
  └── /api/* ────────────────▶ ALB (X-From-CloudFront 헤더 검사)
                                  │
                                  ▼
                          ECS Fargate Service (wooriteam-cluster / wooriteam-service)
                          ├── Private Subnet (AZ-a)
                          └── Private Subnet (AZ-b)
                                  │
                                  ▼
                          RDS MySQL 8.0 Multi-AZ (wooriteam-db)
```

| 영역 | 구성 |
|---|---|
| 진입점 | CloudFront — 정적 자원은 S3, `/api/*`는 ALB로 라우팅 |
| 프론트엔드 | S3 정적 호스팅 + CloudFront 캐시/무효화 |
| 백엔드 | ECS Fargate (2 AZ, task family `wooriteam-task`, 컨테이너 `wooriteam-app`) + ALB (헬스체크 `/actuator/health`) |
| 네트워크 | VPC (Public/Private/DB 서브넷 × 2 AZ), NAT Gateway × 2, `alb-sg → ecs-sg → rds-sg` 단계적 보안그룹 |
| 데이터베이스 | RDS MySQL 8.0 Multi-AZ, 전용 파라미터 그룹(utf8mb4, slow query log) |
| 시크릿 관리 | Secrets Manager — DB 자격증명, JWT secret, CloudFront origin secret |
| 모니터링 | CloudWatch 알람(11종) + 대시보드, SNS → Lambda → Discord 알림, Grafana Cloud 시각화 |
| 도메인 | 커스텀 도메인 미구매(`domain_name = ""`) — CloudFront 기본 도메인(`*.cloudfront.net`)으로 운영 중. Route 53/ACM 리소스는 `var.domain_name != ""` 조건부로 비활성 상태 |

ALB는 CloudFront에서 보내는 커스텀 헤더(`X-From-CloudFront`)를 검사하는 리스너 규칙으로 ALB 직접 접근을 차단하여, 모든 API 요청이 CloudFront를 거치도록 강제합니다. 이 검증은 CD 파이프라인의 스모크 테스트(`cd.yml`)에도 동일하게 적용되어, 배포 직후 헬스체크 요청에도 같은 헤더를 첨부합니다.

운영 환경은 `application-prod.yaml`(`SPRING_PROFILES_ACTIVE=prod`)을 통해 RDS 접속 정보·HikariCP 커넥션 풀·Graceful Shutdown(30s) 설정을 적용합니다.

> ECS 대신 EKS(Kubernetes)로 전환하는 대안 설계는 `docs/infra-eks.md`에 별도로 정리되어 있으며, 현재 `infra/`에는 적용되어 있지 않습니다(ECS 기반 코드만 존재).

---

## CI/CD

GitHub Actions 기반 CI/CD 파이프라인입니다(설계 상세: `docs/cicd.md`, 코드: `.github/workflows/`).

| 워크플로 | 트리거 (현재 코드 기준) | 주요 단계 |
|---|---|---|
| `ci.yml` | `feature/infra1` 브랜치 대상 PR | `dorny/paths-filter`로 변경 경로(`src/**`/`frontend/**`) 감지 → 백엔드(Gradle 빌드·테스트), 프론트엔드(npm 빌드·lint) job을 변경된 영역만 실행 |
| `cd.yml` | `develop` 브랜치 push (백엔드 관련 경로 변경) | ① Gradle 빌드·테스트 → ② ECR 레포지토리 URI 조회 → ③ Docker 이미지 빌드(`{sha}`/`latest` 태그) → ④ Trivy CRITICAL 취약점 스캔 → ⑤ ECR 푸시 → ⑥ ECS Task Definition 갱신 후 롤링 배포(`wait-for-service-stability`, 최대 10분) → ⑦ `X-From-CloudFront` 헤더를 포함한 `/actuator/health` 스모크 테스트(10회×10초) → ⑧ 실패 시 직전 Task Definition으로 자동 롤백 → ⑨ Discord 알림(성공/실패) |
| `cd-frontend.yml` | `develop` 브랜치 push (`frontend/**` 변경) | ① npm 빌드(Vite) → ② `aws s3 sync --delete` → ③ CloudFront 캐시 무효화(`/*`) → ④ Discord 알림(성공/실패) |

> 트리거 브랜치는 워크플로 파일에 `main`으로 주석 처리되어 있고, 현재는 개발 단계라 `develop`/`feature/infra1`을 대상으로 운영 중입니다. main 브랜치로 전환 시 각 워크플로의 `branches` 값만 바꾸면 됩니다.

배포에 필요한 자격 정보·리소스 식별자(ECR/ECS/ALB/S3/CloudFront/CloudFront origin secret 등)는 모두 GitHub Secrets로 관리합니다. `ECR_REPOSITORY` 값은 시크릿으로 등록하지 않고 `aws ecr describe-repositories`로 워크플로 실행 시점에 동적으로 조회합니다.

ECS 무중단 배포를 위해 ALB Deregistration Delay(30s)와 애플리케이션의 Graceful Shutdown(30s)을 맞춰두었으며, 배포 직후 스모크 테스트가 실패하면 이전 태스크 정의로 즉시 롤백됩니다. JaCoCo 커버리지 게이트는 `docs/cicd.md`에 설계만 되어 있고 `ci.yml`에는 아직 적용되어 있지 않습니다(TODO 주석으로 남아있음).

---

## API 목록

### 인증 (`/api/auth`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | 회원가입 |
| POST | `/api/auth/login` | ❌ | 로그인 → JWT 반환 |
| POST | `/api/auth/logout` | ✅ | 로그아웃 (토큰 블랙리스트 처리) |
| DELETE | `/api/auth/withdraw` | ✅ | 회원 탈퇴 |

### 공고 (`/api/posts`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/posts` | ❌ | 공고 목록 (`role`/`difficulty`/`projectType`/`techStack`/`keyword` 필터·검색) |
| GET | `/api/posts/{postId}` | ❌ | 공고 상세 |
| POST | `/api/posts` | ✅ | 공고 작성 |
| PUT | `/api/posts/{postId}` | ✅ | 공고 수정 (작성자만) |
| DELETE | `/api/posts/{postId}` | ✅ | 공고 삭제 (작성자만) |
| PATCH | `/api/posts/{postId}/close` | ✅ | 마감 처리 (작성자만) |
| POST | `/api/posts/{postId}/bookmark` | ✅ | 공고 북마크 추가 |
| DELETE | `/api/posts/{postId}/bookmark` | ✅ | 공고 북마크 삭제 |

### 지원 (`/api/posts/{postId}/applications`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/posts/{postId}/applications` | ✅ | 지원 제출 |
| GET | `/api/posts/{postId}/applications` | ✅ | 지원자 목록 (게시자만 조회 가능) |
| GET | `/api/posts/{postId}/applications/me` | ✅ | 내 지원 내역 조회 |
| PUT | `/api/posts/{postId}/applications/me` | ✅ | 내 지원 내역 수정 |
| DELETE | `/api/posts/{postId}/applications/me` | ✅ | 내 지원 철회 (소프트 삭제) |

### 회원 공개 프로필 (`/api/users`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/users` | ✅ | 공개 설정된 회원 프로필 목록 |
| GET | `/api/users/{userId}` | ✅ | 회원 공개 프로필 상세 |

### 그룹 (`/api/groups`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/groups` | ✅ | 그룹 목록 |
| GET | `/api/groups/{groupId}` | ✅ | 그룹 상세 (멤버·가입 신청 현황 포함) |
| POST | `/api/groups` | ✅ | 그룹 생성 |
| POST | `/api/groups/{groupId}/members` | ✅ | 그룹 가입 신청 |
| PATCH | `/api/groups/{groupId}/members/{memberId}/approve` | ✅ | 가입 신청 승인 (그룹장만) |
| DELETE | `/api/groups/{groupId}/members/{memberId}` | ✅ | 멤버 제외 (그룹장만) |
| GET | `/api/groups/{groupId}/posts` | ✅ | 그룹 소속 공고 목록 |

### 신고 (`/api/reports`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/reports` | ❌ | 공고/회원 신고 접수 |

### 마이페이지 (`/api/my`)

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/my/posts` | ✅ | 내가 올린 공고 목록 |
| GET | `/api/my/applications` | ✅ | 내가 지원한 공고 목록 |
| PATCH | `/api/my/password` | ✅ | 비밀번호 변경 |
| GET | `/api/my/profile` | ✅ | 내 프로필 조회 |
| PUT | `/api/my/profile` | ✅ | 내 프로필 수정 (공개 여부·기술스택·경력 등) |
| GET | `/api/my/bookmarks` | ✅ | 내가 북마크한 공고 목록 |
| GET | `/api/my/groups` | ✅ | 내가 소속된 그룹 목록 |

### 응답 형식

모든 API는 아래 형식으로 응답합니다.

```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

오류 시:

```json
{
  "success": false,
  "data": null,
  "message": "이미 사용 중인 이메일입니다."
}
```

---

문의: simsohyeon04@gmail.com
멋쟁이사자처럼 로켓단 22기 인턴십 클라우드 개인 프로젝트