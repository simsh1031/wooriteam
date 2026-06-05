# 우리팀 (wooriteam)

대학생·비전공자를 위한 역할 중심 팀 프로젝트 구인 플랫폼

---

## 목차

1. [실행 방법](#실행-방법)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [구동 원리](#구동-원리)
5. [API 목록](#api-목록)

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
│   │   └── SecurityConfig.java       # Spring Security + CORS 설정
│   ├── security/
│   │   ├── JwtProvider.java          # JWT 생성·검증
│   │   ├── JwtAuthenticationFilter.java  # 요청마다 JWT 파싱
│   │   ├── CustomUserDetails.java    # Spring Security 사용자 정보
│   │   └── CustomUserDetailsService.java
│   ├── entity/
│   │   ├── User.java                 # 회원
│   │   ├── Post.java                 # 모집공고
│   │   ├── PostRole.java             # 공고별 모집 역할
│   │   └── Application.java         # 지원 정보
│   ├── enums/
│   │   ├── RoleType.java             # BACKEND | FRONTEND | DESIGN | PLANNING
│   │   ├── Difficulty.java           # BEGINNER | INTERMEDIATE | ADVANCED
│   │   └── ProjectType.java         # SIDE_PROJECT | GRADUATION | ...
│   ├── repository/                   # JPA Repository 인터페이스
│   ├── service/
│   │   ├── AuthService.java          # 회원가입·로그인·탈퇴
│   │   ├── PostService.java          # 공고 CRUD·마감
│   │   ├── ApplicationService.java   # 지원 제출·목록
│   │   └── MyPageService.java        # 내 공고·내 지원 조회
│   ├── controller/                   # REST 컨트롤러 (요청 수신·응답)
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
│   └── application.yaml             # DB·JPA·JWT 설정
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # axios 인스턴스 (JWT 자동 첨부)
│   │   │   ├── types.ts             # 공유 타입 정의
│   │   │   ├── auth.ts              # 인증 API 함수
│   │   │   ├── posts.ts             # 공고 API 함수
│   │   │   └── applications.ts     # 지원 API 함수
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # 로그인 상태 전역 관리
│   │   ├── components/
│   │   │   ├── Header.tsx           # 전역 헤더 (로그인 상태 반영)
│   │   │   └── PostCard.tsx         # 공고 카드 컴포넌트
│   │   ├── pages/
│   │   │   ├── MainPage.tsx         # 메인·랜딩 페이지
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── PostListPage.tsx     # 역할 탭별 공고 목록
│   │   │   ├── PostDetailPage.tsx   # 공고 상세
│   │   │   ├── PostFormPage.tsx     # 공고 작성·수정 (같은 폼)
│   │   │   ├── ApplyPage.tsx        # 지원서 제출
│   │   │   ├── ApplicantsPage.tsx   # 지원자 목록 (게시자 전용)
│   │   │   └── MyPage.tsx           # 마이페이지
│   │   ├── App.tsx                  # 라우팅 정의
│   │   └── index.css               # CSS 변수·공통 스타일
│   └── vite.config.ts              # Vite 설정 (API 프록시 포함)
│
├── .env                             # 환경변수 (DB·JWT 비밀키)
├── build.gradle                     # 백엔드 의존성
└── PLAN.md                          # 기획안
```

---

## 구동 원리

### 전체 흐름

```
브라우저(localhost:5173)
    ↓  정적 파일 (HTML/JS/CSS)
Vite Dev Server
    ↓  /api/* 요청을 프록시
Spring Boot Server(localhost:8080)
    ↓  JPA
MySQL(localhost:3306/wooriteam)
```

개발 환경에서 프론트엔드는 Vite가 서빙하고, `/api` 로 시작하는 요청은 자동으로 백엔드 8080포트로 전달합니다. 덕분에 CORS 문제 없이 같은 출처로 통신하는 것처럼 동작합니다.

### 인증 흐름 (JWT)

```
1. POST /api/auth/login
   → 서버가 이메일·비밀번호 검증 후 JWT 발급
   → 클라이언트는 localStorage에 토큰 저장

2. 이후 모든 인증 필요 요청
   → axios 인터셉터가 헤더에 자동으로 토큰 첨부
      Authorization: Bearer <token>

3. 백엔드 JwtAuthenticationFilter
   → 요청마다 토큰 파싱 → 유효하면 SecurityContext에 사용자 정보 등록
   → 컨트롤러에서 @AuthenticationPrincipal로 현재 사용자 접근

4. 토큰 만료(401) 시
   → axios 인터셉터가 localStorage 토큰 삭제 후 /login 으로 리다이렉트
```

### 공고-역할 관계

하나의 공고(`Post`)는 여러 역할(`PostRole`)을 가질 수 있습니다.
역할 탭 필터링은 PostRole 테이블을 JOIN해서 해당 역할이 있는 공고만 조회합니다.

```
Post (1) ────── (N) PostRole
  └── title            └── roleType (BACKEND | FRONTEND | DESIGN | PLANNING)
  └── description      └── description
  └── is_closed        └── techStack
```

지원(`Application`)은 공고와 역할을 모두 참조합니다.
어떤 역할로 지원했는지 저장하고, 중복 지원은 `(post, role, user)` 조합으로 방지합니다.

### 권한 구조

| 기능 | 비회원 | 회원 | 공고 게시자 |
|---|---|---|---|
| 공고 목록·상세 조회 | ✅ | ✅ | ✅ |
| 공고 작성 | ❌ | ✅ | ✅ |
| 공고 수정·삭제·마감 | ❌ | ❌ | ✅ |
| 지원 제출 | ❌ | ✅ | ❌ |
| 지원자 목록 조회 | ❌ | ❌ | ✅ |
| 내 공고·지원 목록 | ❌ | ✅ | ✅ |

---

## API 목록

### 인증

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | 회원가입 |
| POST | `/api/auth/login` | ❌ | 로그인 → JWT 반환 |
| POST | `/api/auth/logout` | ✅ | 로그아웃 (클라이언트 토큰 삭제) |
| DELETE | `/api/auth/withdraw` | ✅ | 회원 탈퇴 |

### 공고

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/posts` | ❌ | 공고 목록 (`?role=BACKEND` 으로 탭 필터링) |
| GET | `/api/posts/{id}` | ❌ | 공고 상세 |
| POST | `/api/posts` | ✅ | 공고 작성 |
| PUT | `/api/posts/{id}` | ✅ | 공고 수정 (작성자만) |
| DELETE | `/api/posts/{id}` | ✅ | 공고 삭제 (작성자만) |
| PATCH | `/api/posts/{id}/close` | ✅ | 마감 처리 (작성자만) |

### 지원

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| POST | `/api/posts/{id}/applications` | ✅ | 지원 제출 |
| GET | `/api/posts/{id}/applications` | ✅ | 지원자 목록 (게시자만 조회 가능) |

### 마이페이지

| Method | URL | 인증 필요 | 설명 |
|---|---|---|---|
| GET | `/api/my/posts` | ✅ | 내가 올린 공고 목록 |
| GET | `/api/my/applications` | ✅ | 내가 지원한 공고 목록 |

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