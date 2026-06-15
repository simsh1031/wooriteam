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
| 400 | 현재 비밀번호가 올바르지 않습니다. | INVALID_PASSWORD |
| 400 | 새 비밀번호가 현재 비밀번호와 동일합니다. | SAME_PASSWORD |
| 400 | 공개 프로필에는 연락 이메일이 필요합니다. | EMAIL_REQUIRED_FOR_PUBLIC |
| 401 | 이메일 또는 비밀번호가 올바르지 않습니다. | INVALID_CREDENTIALS |
| 403 | 공고에 대한 권한이 없습니다. | POST_ACCESS_DENIED |
| 403 | 지원자 목록 조회 권한이 없습니다. | APPLICATION_ACCESS_DENIED |
| 403 | 비공개 프로필입니다. | PROFILE_NOT_PUBLIC |
| 404 | 사용자를 찾을 수 없습니다. | USER_NOT_FOUND |
| 404 | 공고를 찾을 수 없습니다. | POST_NOT_FOUND |
| 404 | 모집 역할을 찾을 수 없습니다. | ROLE_NOT_FOUND |
| 404 | 지원 내역을 찾을 수 없습니다. | APPLICATION_NOT_FOUND |
| 404 | 프로필을 찾을 수 없습니다. | PROFILE_NOT_FOUND |
| 409 | 이미 사용 중인 이메일입니다. | EMAIL_DUPLICATED |
| 409 | 이미 지원한 역할입니다. | ALREADY_APPLIED |

### ENUM 값 정의

| ENUM | 값 |
|---|---|
| `RoleType` | `BACKEND`, `FRONTEND`, `DESIGN`, `PLANNING` |
| `Difficulty` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `ProjectType` | `SIDE_PROJECT`, `GRADUATION`, `HACKATHON`, `STUDY`, `OTHER` |
| `CareerType` | `NON_MAJOR_STUDENT`, `MAJOR_STUDENT`, `BOOTCAMP`, `JOB_SEEKER`, `JUNIOR`, `SENIOR`, `OTHER` |

---

## 구현 현황 요약

| 영역 | API | 상태 |
|---|---|---|
| 인증 | 회원가입, 로그인, 로그아웃, 회원탈퇴 | ✅ 구현 완료 |
| 공고 | CRUD + 마감 처리 + 역할 탭 필터 + 지원 마감일·프로젝트 기간 | ✅ 구현 완료 |
| 지원 | 지원하기, 지원자 목록 조회, 내 지원 조회/수정/철회 | ✅ 구현 완료 |
| 마이페이지 | 내 공고 목록, 내 지원 목록, 비밀번호 변경, 프로필 조회/수정 | ✅ 구현 완료 |
| 필터링 | 난이도·기술스택·프로젝트유형·키워드 필터 | ✅ 구현 완료 (Should) |
| 회원 프로필 | 프로필 CRUD(경력 구분·연락 이메일 포함), 공개 프로필 목록/상세 | ✅ 구현 완료 (Should) |
| 검색 | 공고 키워드 검색 | ✅ 구현 완료 (Should) |
| 북마크 | 북마크 추가/삭제, 북마크 목록 | ⬜ 미구현 (Could) |
| 그룹 | 그룹 CRUD, 가입 신청/승인 | ⬜ 미구현 (Could) |
| 신고 | 신고 접수 | ⬜ 미구현 (Could) |
| 공고 자동 마감 | 마감일 경과 시 `closed` 자동 전환(스케줄러) | ⬜ 미구현 (Could) |

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
| `difficulty` | Difficulty | X | 난이도 필터 |
| `projectType` | ProjectType | X | 프로젝트 유형 필터 |
| `techStack` | string[] | X | 기술스택 키워드 필터 (다중 선택, `?techStack=Java&techStack=React`) |
| `keyword` | string | X | 제목·설명 통합 검색 |

**예시**
```
GET /api/posts
GET /api/posts?role=BACKEND
GET /api/posts?role=FRONTEND&difficulty=BEGINNER&projectType=SIDE_PROJECT
GET /api/posts?keyword=스프링
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
      "applicationDeadline": "2026-07-01",
      "projectStartDate": "2026-07-05",
      "projectEndDate": "2026-09-30",
      "createdAt": "2026-06-04T10:00:00",
      "authorNickname": "홍길동",
      "roleTypes": ["BACKEND", "FRONTEND"],
      "roleStacks": [
        { "roleType": "BACKEND", "techStack": "Java, Spring Boot, MySQL" },
        { "roleType": "FRONTEND", "techStack": "React, TypeScript" }
      ]
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
| `applicationDeadline` | string (`yyyy-MM-dd`) \| null | 지원 마감일 |
| `projectStartDate` | string (`yyyy-MM-dd`) \| null | 프로젝트 시작일 |
| `projectEndDate` | string (`yyyy-MM-dd`) \| null | 프로젝트 종료일 |
| `createdAt` | string (ISO 8601) | 작성일시 |
| `authorNickname` | string | 작성자 닉네임 |
| `roleTypes` | RoleType[] | 모집 중인 역할 목록 |
| `roleStacks` | RoleStack[] | 역할별 모집 기술스택 (`roleType`, `techStack`) |

> 마감 처리된 공고(`closed: true`)와 지원 마감일(`applicationDeadline`)이 지난 공고는 목록에서 자동 제외된다. 단, 마이페이지의 "내 공고"·"내 지원" 목록은 별도 조회 경로라 영향 없이 계속 노출된다.

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
    "applicationDeadline": "2026-07-01",
    "projectStartDate": "2026-07-05",
    "projectEndDate": "2026-09-30",
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
| `applicationDeadline` | string (`yyyy-MM-dd`) \| null | 지원 마감일 |
| `projectStartDate` | string (`yyyy-MM-dd`) \| null | 프로젝트 시작일 |
| `projectEndDate` | string (`yyyy-MM-dd`) \| null | 프로젝트 종료일 |
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
| `applicationDeadline` | string (`yyyy-MM-dd`) | X | 지원 마감일 |
| `projectStartDate` | string (`yyyy-MM-dd`) | X | 프로젝트 시작일 |
| `projectEndDate` | string (`yyyy-MM-dd`) | X | 프로젝트 종료일 |
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
  "applicationDeadline": "2026-07-01",
  "projectStartDate": "2026-07-05",
  "projectEndDate": "2026-09-30",
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
    "createdAt": "2026-06-04T11:00:00",
    "withdrawn": false
  },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `withdrawn` | boolean | 지원 철회 여부 |

**에러**
- `400 Bad Request`: roleId가 해당 공고의 역할이 아닌 경우 (`ROLE_NOT_IN_POST`)
- `404 Not Found`: 공고 없음 / 역할 없음
- `409 Conflict`: 동일 역할에 이미 지원한 경우 (`ALREADY_APPLIED`)

> 이전에 철회(`withdrawn: true`)한 지원 내역이 있는 상태에서 다시 호출하면 `ALREADY_APPLIED` 없이 기존 내역을 갱신하고 `withdrawn`을 `false`로 복원한다 (재지원).

---

### 3-2. 내 지원 정보 조회

```
GET /api/posts/{postId}/applications/me
인증 필요
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Response** `200 OK` — [지원하기 응답](#3-1-지원하기)과 동일한 `data` 구조

> 지원 내역이 없으면 `data: null`을 반환한다 (에러 아님). 철회된 내역(`withdrawn: true`)도 그대로 반환된다.

**에러**
- `404 Not Found`: 공고 없음

---

### 3-3. 내 지원 정보 수정

```
PUT /api/posts/{postId}/applications/me
인증 필요
```

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `postId` | number | 공고 ID |

**Request Body** — [지원하기](#3-1-지원하기)와 동일한 구조

**Response** `200 OK` — [지원하기 응답](#3-1-지원하기)과 동일한 `data` 구조

> 철회(`withdrawn: true`)된 지원 내역은 수정할 수 없다 — 복원하려면 [지원하기](#3-1-지원하기) API를 다시 호출해야 한다.

**에러**
- `400 Bad Request`: roleId가 해당 공고의 역할이 아닌 경우 (`ROLE_NOT_IN_POST`)
- `404 Not Found`: 공고 없음 / 역할 없음 / 지원 내역 없음 또는 이미 철회됨 (`APPLICATION_NOT_FOUND`)

---

### 3-4. 내 지원 철회

```
DELETE /api/posts/{postId}/applications/me
인증 필요
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

> 지원 데이터를 삭제하지 않고 `withdrawn = true`로 표시하는 소프트 삭제 방식. 이후 동일 역할에 재지원([3-3](#3-3-내-지원-정보-수정))하면 기존 내용이 복원된다.

**에러**
- `404 Not Found`: 공고 없음 / 지원 내역 없음 (`APPLICATION_NOT_FOUND`)

---

### 3-5. 지원자 목록 조회

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
      "createdAt": "2026-06-04T11:00:00",
      "withdrawn": false
    }
  ],
  "message": null
}
```

> 철회(`withdrawn: true`)된 지원 내역도 함께 포함되어 반환된다.

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

> 철회(`withdrawn: true`)된 지원 내역은 목록에서 제외된다.

---

### 4-3. 비밀번호 변경

```
PATCH /api/my/password
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| `currentPassword` | string | O | - | 현재 비밀번호 |
| `newPassword` | string | O | 8자 이상 | 새 비밀번호 |

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
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

**에러**
- `400 Bad Request`: 현재 비밀번호가 올바르지 않음 (`INVALID_PASSWORD`)
- `400 Bad Request`: 새 비밀번호가 현재 비밀번호와 동일 (`SAME_PASSWORD`)

---

### 4-4. 내 프로필 조회

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
    "careerType": "BOOTCAMP",
    "experience": "개인 프로젝트 3개, 부트캠프 수료",
    "isPublic": true,
    "contactEmail": "contact@example.com"
  },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `userId` | number | 사용자 ID |
| `nickname` | string | 닉네임 |
| `email` | string | 가입 이메일 (로그인용) |
| `techStack` | string \| null | 기술 스택 |
| `careerType` | CareerType \| null | 경력 구분 |
| `experience` | string \| null | 경험 요약 |
| `isPublic` | boolean | 프로필 공개 여부 |
| `contactEmail` | string \| null | 공개 프로필에 노출되는 연락 이메일 |

> 프로필을 아직 생성하지 않은 회원도 기본값(`isPublic: false`, 나머지 필드 `null`)으로 조회된다.

#### `CareerType` ENUM

`NON_MAJOR_STUDENT`, `MAJOR_STUDENT`, `BOOTCAMP`, `JOB_SEEKER`, `JUNIOR`, `SENIOR`, `OTHER`

---

### 4-5. 내 프로필 수정

```
PUT /api/my/profile
인증 필요
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `techStack` | string | X | 기술 스택 |
| `careerType` | CareerType | X | 경력 구분 |
| `experience` | string | X | 경험 요약 |
| `isPublic` | boolean | O | 프로필 공개 여부 |
| `contactEmail` | string | X (`isPublic=true`이면 O) | 공개 프로필에 노출되는 연락 이메일 |

```json
{
  "techStack": "Java, Spring Boot, React",
  "careerType": "BOOTCAMP",
  "experience": "개인 프로젝트 3개, 부트캠프 수료",
  "isPublic": true,
  "contactEmail": "contact@example.com"
}
```

**Response** `200 OK` — [내 프로필 조회](#4-4-내-프로필-조회)와 동일한 `data` 구조

**에러**
- `400 Bad Request`: `isPublic: true`인데 `contactEmail`이 비어있음 (`EMAIL_REQUIRED_FOR_PUBLIC`)

---

## 5. 회원 프로필 공개 (`/api/users`)

### 5-1. 공개 프로필 목록 조회

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
      "careerType": "BOOTCAMP"
    }
  ],
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `userId` | number | 사용자 ID |
| `nickname` | string | 닉네임 |
| `techStack` | string \| null | 기술 스택 |
| `careerType` | CareerType \| null | 경력 구분 |

> `isPublic: true`로 설정한 프로필만 목록에 노출된다.

---

### 5-2. 공개 프로필 상세 조회

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
    "email": "contact@example.com",
    "techStack": "React, TypeScript",
    "careerType": "BOOTCAMP",
    "experience": "프론트엔드 부트캠프 수료"
  },
  "message": null
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `userId` | number | 사용자 ID |
| `nickname` | string | 닉네임 |
| `email` | string \| null | 프로필에 등록한 연락 이메일 (`contactEmail`) |
| `techStack` | string \| null | 기술 스택 |
| `careerType` | CareerType \| null | 경력 구분 |
| `experience` | string \| null | 경험 요약 |

**에러**
- `404 Not Found`: 프로필이 없는 사용자 (`PROFILE_NOT_FOUND`)
- `403 Forbidden`: 비공개 프로필 (`PROFILE_NOT_PUBLIC`)

---

# ⬜ 미구현 API (Could)

---

## 6. 공고 북마크 (Could)

### 6-1. 북마크 추가

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

### 6-2. 북마크 삭제

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

### 6-3. 내 북마크 목록 조회

```
GET /api/my/bookmarks
인증 필요
```

**Response** `200 OK` — [공고 목록 응답](#2-1-공고-목록-조회)과 동일한 배열 구조

---

## 7. 그룹 기능 (Could)

### 7-1. 그룹 목록 조회

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

### 7-2. 그룹 생성

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

### 7-3. 그룹 상세 조회

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

### 7-4. 그룹 가입 신청

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

### 7-5. 가입 신청 처리 (그룹장 전용)

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

## 8. 신고/스팸 (Could)

### 8-1. 신고 접수

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

## 9. 공고 자동 마감 (Could)

> 공고 작성/수정 시 `applicationDeadline` 필드는 이미 구현되어 있으며, 마감일이 지난 공고는 [공고 목록 조회](#2-1-공고-목록-조회)에서 자동 제외된다 (구현 완료).
> 다만 공고의 `closed` 플래그 자체를 스케줄러로 자동 전환하는 기능은 아직 미구현 — 작성자가 [공고 마감 처리](#2-6-공고-마감-처리) API를 직접 호출해야 `closed: true`로 바뀐다.

---

*최종 업데이트: 2026-06-15*