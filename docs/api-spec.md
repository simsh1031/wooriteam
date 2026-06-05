# 우리팀 API 명세서

> **Base URL**: `http://localhost:8080`
> **Content-Type**: `application/json`
> **인증**: JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 공통 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `success` | boolean | 요청 성공 여부 |
| `data` | object \| null | 응답 데이터 |
| `message` | string \| null | 에러 메시지 (성공 시 null) |

### 공통 에러 코드

| HTTP Status | 에러 메시지 | 설명 |
|---|---|---|
| 400 | 이미 마감된 공고입니다. | POST_ALREADY_CLOSED |
| 400 | 해당 역할은 이 공고에 속하지 않습니다. | ROLE_NOT_IN_POST |
| 401 | 이메일 또는 비밀번호가 올바르지 않습니다. | INVALID_CREDENTIALS |
| 403 | 공고에 대한 권한이 없습니다. | POST_ACCESS_DENIED |
| 403 | 지원자 목록 조회 권한이 없습니다. | APPLICATION_ACCESS_DENIED |
| 404 | 사용자를 찾을 수 없습니다. | USER_NOT_FOUND |
| 404 | 공고를 찾을 수 없습니다. | POST_NOT_FOUND |
| 404 | 모집 역할을 찾을 수 없습니다. | ROLE_NOT_FOUND |
| 409 | 이미 사용 중인 이메일입니다. | EMAIL_DUPLICATED |
| 409 | 이미 지원한 역할입니다. | ALREADY_APPLIED |

### ENUM 값 정의

| ENUM | 값 |
|---|---|
| `RoleType` | `BACKEND`, `FRONTEND`, `DESIGN`, `PLANNING` |
| `Difficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `ProjectType` | `SIDE_PROJECT`, `GRADUATION`, `HACKATHON`, `STUDY`, `OTHER` |

---

## 구현 현황 요약

| 영역 | API | 상태 |
|---|---|---|
| 인증 | 회원가입, 로그인, 로그아웃, 회원탈퇴 | ✅ 구현 완료 |
| 공고 | CRUD + 마감 처리 + 역할 탭 필터 | ✅ 구현 완료 |
| 지원 | 지원하기, 지원자 목록 조회 | ✅ 구현 완료 |
| 마이페이지 | 내 공고 목록, 내 지원 목록 | ✅ 구현 완료 |
| 필터링 | 난이도·기술스택·프로젝트유형 필터 | ⬜ 미구현 (Should) |
| 회원 프로필 | 프로필 CRUD, 공개 프로필 목록/상세 | ⬜ 미구현 (Should) |
| 검색 | 공고 키워드 검색 | ⬜ 미구현 (Should) |
| 북마크 | 북마크 추가/삭제, 북마크 목록 | ⬜ 미구현 (Could) |
| 그룹 | 그룹 CRUD, 가입 신청/승인 | ⬜ 미구현 (Could) |
| 신고 | 신고 접수 | ⬜ 미구현 (Could) |

---

# ✅ 구현 완료 API

---

## 1. 인증 (`/api/auth`)

### 1-1. 회원가입

```
POST /api/auth/signup
인증 불필요
```

**Request Body**

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| `email` | string | O | 이메일 형식 | 이메일 |
| `password` | string | O | 8자 이상 | 비밀번호 |
| `nickname` | string | O | 20자 이하 | 닉네임 |

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

### 1-2. 로그인

```
POST /api/auth/login
인증 불필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | O | 이메일 |
| `password` | string | O | 비밀번호 |

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nickname": "홍길동"
  },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `token` | string | JWT 액세스 토큰 |
| `nickname` | string | 로그인한 사용자 닉네임 |

---

### 1-3. 로그아웃

```
POST /api/auth/logout
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

> 서버 측에서 별도 처리 없이 클라이언트가 토큰을 폐기하는 방식.

---

### 1-4. 회원탈퇴

```
DELETE /api/auth/withdraw
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

## 2. 모집공고 (`/api/posts`)

### 2-1. 공고 목록 조회

```
GET /api/posts
인증 불필요
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `role` | RoleType | X | 역할 탭 필터 (`BACKEND`, `FRONTEND`, `DESIGN`, `PLANNING`) |

**예시**
```
GET /api/posts
GET /api/posts?role=BACKEND
GET /api/posts?role=FRONTEND
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "React + Spring Boot 사이드 프로젝트 팀원 모집",
      "difficulty": "BEGINNER",
      "projectType": "SIDE_PROJECT",
      "closed": false,
      "createdAt": "2026-06-04T10:00:00",
      "authorNickname": "홍길동",
      "roleTypes": ["BACKEND", "FRONTEND"]
    }
  ],
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 공고 ID |
| `title` | string | 공고 제목 |
| `difficulty` | Difficulty \| null | 난이도 |
| `projectType` | ProjectType \| null | 프로젝트 유형 |
| `closed` | boolean | 마감 여부 |
| `createdAt` | string (ISO 8601) | 작성일시 |
| `authorNickname` | string | 작성자 닉네임 |
| `roleTypes` | RoleType[] | 모집 중인 역할 목록 |

> ⚠️ **현재 코드와 PLAN.md 불일치**: PLAN.md 기준으로 마감 공고(`closed: true`)는 기본적으로 탭에서 제외해야 함. 현재 코드는 마감 공고도 함께 반환 중 — PostRepository 및 서비스 수정 필요.

---

### 2-2. 공고 상세 조회

```
GET /api/posts/{postId}
인증 불필요
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "React + Spring Boot 사이드 프로젝트 팀원 모집",
    "description": "함께 성장할 팀원을 찾습니다...",
    "difficulty": "BEGINNER",
    "projectType": "SIDE_PROJECT",
    "closed": false,
    "createdAt": "2026-06-04T10:00:00",
    "authorId": 1,
    "authorNickname": "홍길동",
    "roles": [
      {
        "id": 1,
        "roleType": "BACKEND",
        "description": "Spring Boot API 개발",
        "techStack": "Java, Spring Boot, MySQL"
      },
      {
        "id": 2,
        "roleType": "FRONTEND",
        "description": "React UI 개발",
        "techStack": "React, TypeScript"
      }
    ]
  },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 공고 ID |
| `title` | string | 공고 제목 |
| `description` | string \| null | 프로젝트 설명 |
| `difficulty` | Difficulty \| null | 난이도 |
| `projectType` | ProjectType \| null | 프로젝트 유형 |
| `closed` | boolean | 마감 여부 |
| `createdAt` | string (ISO 8601) | 작성일시 |
| `authorId` | number | 작성자 ID |
| `authorNickname` | string | 작성자 닉네임 |
| `roles[].id` | number | 역할 ID |
| `roles[].roleType` | RoleType | 역할 타입 |
| `roles[].description` | string \| null | 역할 설명 |
| `roles[].techStack` | string \| null | 역할별 기술 스택 |

---

### 2-3. 공고 작성

```
POST /api/posts
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | string | O | 공고 제목 |
| `description` | string | X | 프로젝트 설명 |
| `difficulty` | Difficulty | X | 난이도 |
| `projectType` | ProjectType | X | 프로젝트 유형 |
| `roles` | PostRoleRequest[] | O | 모집 역할 (1개 이상) |
| `roles[].roleType` | RoleType | O | 역할 타입 |
| `roles[].description` | string | X | 역할 설명 |
| `roles[].techStack` | string | X | 역할별 기술 스택 |

```json
{
  "title": "React + Spring Boot 사이드 프로젝트 팀원 모집",
  "description": "함께 성장할 팀원을 찾습니다.",
  "difficulty": "BEGINNER",
  "projectType": "SIDE_PROJECT",
  "roles": [
    {
      "roleType": "BACKEND",
      "description": "Spring Boot API 개발",
      "techStack": "Java, Spring Boot, MySQL"
    },
    {
      "roleType": "FRONTEND",
      "description": "React UI 개발",
      "techStack": "React, TypeScript"
    }
  ]
}
```

**Response** `200 OK` — [공고 상세 응답](#2-2-공고-상세-조회)과 동일한 `data` 구조

---

### 2-4. 공고 수정

```
PUT /api/posts/{postId}
인증 필요 (작성자 본인만 가능)
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Request Body** — [공고 작성](#2-3-공고-작성)과 동일한 구조

**Response** `200 OK` — [공고 상세 응답](#2-2-공고-상세-조회)과 동일한 `data` 구조

**에러**
- `403 Forbidden`: 본인 공고가 아닌 경우 (`POST_ACCESS_DENIED`)
- `404 Not Found`: 공고 없음 (`POST_NOT_FOUND`)

---

### 2-5. 공고 삭제

```
DELETE /api/posts/{postId}
인증 필요 (작성자 본인만 가능)
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

**에러**
- `403 Forbidden`: 본인 공고가 아닌 경우
- `404 Not Found`: 공고 없음

---

### 2-6. 공고 마감 처리

```
PATCH /api/posts/{postId}/close
인증 필요 (작성자 본인만 가능)
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

**에러**
- `400 Bad Request`: 이미 마감된 공고 (`POST_ALREADY_CLOSED`)
- `403 Forbidden`: 본인 공고가 아닌 경우
- `404 Not Found`: 공고 없음

---

## 3. 지원 (`/api/posts/{postId}/applications`)

### 3-1. 지원하기

```
POST /api/posts/{postId}/applications
인증 필요
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `roleId` | number | O | 지원할 역할 ID (`PostRole.id`) |
| `motivation` | string | O | 지원동기 |
| `techStack` | string | X | 기술 스택 |
| `experience` | string | X | 관련 경험 |
| `contact` | string | O | 연락처 (이메일, 오픈채팅 등) |

```json
{
  "roleId": 1,
  "motivation": "Spring Boot를 실무 수준으로 익히고 싶습니다.",
  "techStack": "Java, Spring Boot",
  "experience": "개인 프로젝트 2개 경험",
  "contact": "kakao: example123"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "roleId": 1,
    "roleType": "BACKEND",
    "applicantNickname": "홍길동",
    "motivation": "Spring Boot를 실무 수준으로 익히고 싶습니다.",
    "techStack": "Java, Spring Boot",
    "experience": "개인 프로젝트 2개 경험",
    "contact": "kakao: example123",
    "createdAt": "2026-06-04T11:00:00"
  },
  "message": null
}
```

**에러**
- `400 Bad Request`: roleId가 해당 공고의 역할이 아닌 경우 (`ROLE_NOT_IN_POST`)
- `404 Not Found`: 공고 없음 / 역할 없음
- `409 Conflict`: 동일 역할에 이미 지원한 경우 (`ALREADY_APPLIED`)

---

### 3-2. 지원자 목록 조회

```
GET /api/posts/{postId}/applications
인증 필요 (해당 공고 작성자만 가능)
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roleId": 1,
      "roleType": "BACKEND",
      "applicantNickname": "홍길동",
      "motivation": "Spring Boot를 실무 수준으로 익히고 싶습니다.",
      "techStack": "Java, Spring Boot",
      "experience": "개인 프로젝트 2개 경험",
      "contact": "kakao: example123",
      "createdAt": "2026-06-04T11:00:00"
    }
  ],
  "message": null
}
```

**에러**
- `403 Forbidden`: 해당 공고 작성자가 아닌 경우 (`APPLICATION_ACCESS_DENIED`)
- `404 Not Found`: 공고 없음

---

## 4. 마이페이지 (`/api/my`)

### 4-1. 내 공고 목록 조회

```
GET /api/my/posts
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "React + Spring Boot 사이드 프로젝트 팀원 모집",
      "difficulty": "BEGINNER",
      "projectType": "SIDE_PROJECT",
      "closed": false,
      "createdAt": "2026-06-04T10:00:00",
      "authorNickname": "홍길동",
      "roleTypes": ["BACKEND", "FRONTEND"]
    }
  ],
  "message": null
}
```

> [공고 목록 응답](#2-1-공고-목록-조회)과 동일한 배열 구조.

---

### 4-2. 내 지원 목록 조회

```
GET /api/my/applications
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "postId": 1,
      "postTitle": "React + Spring Boot 사이드 프로젝트 팀원 모집",
      "roleType": "BACKEND",
      "postClosed": false,
      "createdAt": "2026-06-04T11:00:00"
    }
  ],
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | 지원 ID |
| `postId` | number | 공고 ID |
| `postTitle` | string | 공고 제목 |
| `roleType` | RoleType | 지원한 역할 |
| `postClosed` | boolean | 공고 마감 여부 |
| `createdAt` | string (ISO 8601) | 지원 일시 |

---

# ⬜ 미구현 API (Should)

---

## 5. 공고 필터링 확장 (Should)

> 기존 `GET /api/posts` API에 쿼리 파라미터 추가

### 5-1. 공고 목록 조회 (필터링 확장)

```
GET /api/posts
인증 불필요
```

**Query Parameters** (현재 `role` 외 추가 필요)

| 파라미터 | 타입 | 필수 | 범위 | 설명 |
|---|---|---|---|---|
| `role` | RoleType | X | Must (완료) | 역할 탭 필터 |
| `difficulty` | Difficulty | X | Should | 난이도 필터 |
| `projectType` | ProjectType | X | Should | 프로젝트 유형 필터 |
| `techStack` | string | X | Should | 기술스택 키워드 필터 |
| `keyword` | string | X | Should | 제목·설명 통합 검색 |
| `groupId` | number | X | Could | 그룹 소속 공고 필터 |

---

## 6. 회원 프로필 공개 (Should)

### 6-1. 내 프로필 조회

```
GET /api/my/profile
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "홍길동",
    "email": "user@example.com",
    "techStack": "Java, Spring Boot, React",
    "experience": "개인 프로젝트 3개, 부트캠프 수료",
    "isPublic": true
  },
  "message": null
}
```

---

### 6-2. 내 프로필 수정

```
PUT /api/my/profile
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `techStack` | string | X | 기술 스택 |
| `experience` | string | X | 경험 요약 |
| `isPublic` | boolean | O | 프로필 공개 여부 |

```json
{
  "techStack": "Java, Spring Boot, React",
  "experience": "개인 프로젝트 3개, 부트캠프 수료",
  "isPublic": true
}
```

**Response** `200 OK` — [내 프로필 조회](#6-1-내-프로필-조회)와 동일한 `data` 구조

---

### 6-3. 공개 프로필 목록 조회

```
GET /api/users
인증 필요 (회원만 열람 가능)
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "userId": 2,
      "nickname": "김철수",
      "techStack": "React, TypeScript",
      "experience": "프론트엔드 부트캠프 수료"
    }
  ],
  "message": null
}
```

---

### 6-4. 공개 프로필 상세 조회

```
GET /api/users/{userId}
인증 필요 (회원만 열람 가능)
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `userId` | number | 사용자 ID |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "userId": 2,
    "nickname": "김철수",
    "email": "kim@example.com",
    "techStack": "React, TypeScript",
    "experience": "프론트엔드 부트캠프 수료"
  },
  "message": null
}
```

> 비공개 프로필 조회 시 `403 Forbidden` 반환 예정.

---

# ⬜ 미구현 API (Could)

---

## 7. 공고 북마크 (Could)

### 7-1. 북마크 추가

```
POST /api/posts/{postId}/bookmark
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

### 7-2. 북마크 삭제

```
DELETE /api/posts/{postId}/bookmark
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

### 7-3. 내 북마크 목록 조회

```
GET /api/my/bookmarks
인증 필요
```

**Response** `200 OK` — [공고 목록 응답](#2-1-공고-목록-조회)과 동일한 배열 구조

---

## 8. 그룹 기능 (Could)

### 8-1. 그룹 목록 조회

```
GET /api/groups
인증 불필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "멋쟁이사자처럼 13기",
      "description": "멋사 13기 프로젝트 그룹",
      "ownerNickname": "홍길동",
      "memberCount": 10,
      "createdAt": "2026-06-01T09:00:00"
    }
  ],
  "message": null
}
```

---

### 8-2. 그룹 생성

```
POST /api/groups
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `name` | string | O | 그룹명 |
| `description` | string | X | 그룹 설명 |

```json
{
  "name": "멋쟁이사자처럼 13기",
  "description": "멋사 13기 프로젝트 그룹"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "멋쟁이사자처럼 13기",
    "description": "멋사 13기 프로젝트 그룹",
    "ownerNickname": "홍길동",
    "memberCount": 1,
    "createdAt": "2026-06-04T12:00:00"
  },
  "message": null
}
```

---

### 8-3. 그룹 상세 조회

```
GET /api/groups/{groupId}
인증 불필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "멋쟁이사자처럼 13기",
    "description": "멋사 13기 프로젝트 그룹",
    "ownerNickname": "홍길동",
    "members": [
      {
        "userId": 1,
        "nickname": "홍길동",
        "status": "APPROVED"
      }
    ],
    "posts": [ ]
  },
  "message": null
}
```

> `posts` 필드는 [공고 목록 응답](#2-1-공고-목록-조회)과 동일한 배열 구조

---

### 8-4. 그룹 가입 신청

```
POST /api/groups/{groupId}/join
인증 필요
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

### 8-5. 가입 신청 처리 (그룹장 전용)

```
PATCH /api/groups/{groupId}/members/{userId}
인증 필요 (그룹장만 가능)
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `status` | string | O | `APPROVED` (승인) 또는 `PENDING` (보류 복원) |

> PLAN.md ERD의 GroupMember status ENUM은 `PENDING·APPROVED` 두 가지만 정의. 거절 시 해당 멤버 레코드를 삭제하거나 별도 DELETE 엔드포인트 사용.

```json
{
  "status": "APPROVED"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

## 9. 신고/스팸 (Could)

### 9-1. 신고 접수

```
POST /api/reports
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `targetType` | string | O | `POST` 또는 `USER` |
| `targetId` | number | O | 신고 대상 ID |
| `reason` | string | O | 신고 사유 |

```json
{
  "targetType": "POST",
  "targetId": 1,
  "reason": "스팸 또는 도배 게시물입니다."
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "data": null,
  "message": null
}
```

---

## 10. 공고 자동 마감 (Could)

> 스케줄러 기반으로 클라이언트 API 없음.
> 공고 작성/수정 시 `deadline` 필드를 추가하여 마감일이 지난 공고를 자동 마감 처리.

**공고 작성/수정 Request Body 추가 필드**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `deadline` | string (ISO 8601) | X | 자동 마감일시 (`2026-07-01T23:59:59`) |

---

*최종 업데이트: 2026-06-04*