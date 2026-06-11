# 우리팀 CI/CD 설계

> GitHub Actions 기반 3-워크플로 구조. PR 단계에서 백엔드/프론트엔드 변경 사항을 각각 검증하고, main 머지 후에는 **변경된 영역만** 자동 배포한다.

---

## 1. 워크플로 구조

| 파일 | 트리거 | 역할 |
|---|---|---|
| `.github/workflows/ci.yml` | PR 오픈·커밋 푸시 (main 대상) | 변경 경로에 따라 백엔드/프론트엔드 job 실행 |
| `.github/workflows/cd.yml` | main 브랜치 push, `paths`: 백엔드 관련 파일 | Docker 빌드 → ECR 푸시 → ECS 배포 |
| `.github/workflows/cd-frontend.yml` | main 브랜치 push, `paths: ['frontend/**']` | Vite 빌드 → S3 동기화 → CloudFront 캐시 무효화 |

```
PR 오픈/업데이트                          main 브랜치 머지
─────────────────                        ─────────────────
.github/workflows/ci.yml                 변경 경로별로 분기

  ┌─ src/**, build.gradle 등 변경         ┌─ src/**, build.gradle, Dockerfile 등 변경
  │   └─ backend job                     │   └─ .github/workflows/cd.yml  (ECS 배포)
  │                                      │
  └─ frontend/** 변경                     └─ frontend/** 변경
      └─ frontend job                         └─ .github/workflows/cd-frontend.yml  (S3+CloudFront 배포)
```

### 기존 설계와의 차이

기존 infra.md 10번 계획은 `push to main → 즉시 배포`의 단선 구조였다.
개선 방향은 다음 두 가지다.

1. **CI/CD 분리** — PR 단계에서 문제를 먼저 잡고, main 머지 후 자동 배포한다.
2. **백엔드/프론트엔드 파이프라인 분리** — `paths` 필터로 변경된 영역만 검증·배포해, 프론트만 수정했는데 ECS가 재배포되거나 그 반대가 되는 일을 방지한다.

---

## 2. CI 워크플로 (`ci.yml`)

**트리거**: PR 오픈·커밋 푸시 (main 브랜치 대상 PR)

```
PR 생성 / 커밋 푸시
        │
        ▼
변경 경로 감지 (dorny/paths-filter)
        │
        ├── src/**, build.gradle*, Dockerfile 등 변경 ──► [백엔드 job]
        │
        └── frontend/** 변경 ─────────────────────────► [프론트엔드 job]
```

두 job은 독립적으로 실행되며, 변경되지 않은 영역의 job은 스킵된다(`paths-filter` outputs를 `if:` 조건으로 사용).

### 2-1. 백엔드 job

```
Gradle 의존성 캐시 복원
        │
        ▼
./gradlew build test
        │  실패 시 → PR 머지 차단
        ▼
./gradlew jacocoTestCoverageVerification   ← build.gradle 설정 필요
        │  커버리지 60% 미만 시 → PR 머지 차단
        ▼
백엔드 CI 통과
```

**핵심 설정**

- **Gradle 빌드 캐시**: 매 실행마다 의존성을 새로 다운로드하지 않도록 캐시. `*.gradle*` 파일 해시 기반으로 캐시 키 생성. 빌드 시간 약 60% 단축 효과.
- **JaCoCo 커버리지 게이트**: 설정 위치는 `build.gradle`(`jacocoTestCoverageVerification` 태스크). 임계값은 전체 라인 커버리지 60% 미만 시 CI 실패. `./gradlew test jacocoTestCoverageVerification` 순서로 실행.

### 2-2. 프론트엔드 job

```
Node 설치 + npm 의존성 캐시 복원 (frontend/package-lock.json 해시 기반)
        │
        ▼
npm ci
        │
        ▼
npm run lint     (eslint .)
        │  실패 시 → PR 머지 차단
        ▼
npm run build    (tsc -b && vite build → frontend/dist)
        │  실패 시 → PR 머지 차단
        ▼
프론트엔드 CI 통과
```

**핵심 설정**

- **작업 디렉토리**: `frontend/` (`working-directory: frontend`)
- **npm 캐시**: `actions/setup-node`의 `cache: 'npm'` + `cache-dependency-path: frontend/package-lock.json`
- 타입 체크(`tsc -b`)는 `npm run build`에 포함되어 있어 별도 스텝 불필요

---

## 3. CD 워크플로 — 백엔드 (`cd.yml`)

**트리거**: main 브랜치 push, `paths`에 백엔드 관련 파일(`src/**`, `build.gradle*`, `Dockerfile`, `.github/workflows/cd.yml` 등) 포함 시에만 실행

```
main 머지 (백엔드 변경)
    │
    ▼
Gradle 빌드 + 테스트 (재확인)
    │
    ▼
Docker 이미지 빌드
    │  태그: {github.sha}
    ▼
Trivy 이미지 취약점 스캔
    │  CRITICAL 취약점 발견 시 → 배포 중단
    ▼
ECR 푸시
    │
    ▼
ECS Task Definition 새 이미지로 등록
    │
    ▼
ECS Service 업데이트 (롤링 배포)
    │
    ▼
aws ecs wait services-stable (타임아웃 10분)
    │
    ▼
스모크 테스트 (GET /actuator/health → 200 확인)
    │  100초 내 응답 없으면 실패
    ├── 성공 → Discord 알림 (배포 성공 ✅)
    └── 실패 → 이전 Task Definition으로 자동 롤백
              → Discord 알림 (배포 실패 ❌)
```

### 핵심 설정

**Trivy 이미지 스캔**
- ECR 푸시 전 컨테이너 이미지 취약점 검사
- CRITICAL 등급 취약점 발견 시 워크플로 중단 (배포 불가)
- 무료 오픈소스 (`aquasecurity/trivy-action` 사용)

**스모크 테스트**
- `aws ecs wait services-stable`은 태스크가 기동됐는지만 확인
- 스모크 테스트는 실제 HTTP 응답(200)까지 검증
- 10회 × 10초 간격으로 재시도, 100초 내 응답 없으면 실패 처리
- 엔드포인트: `https://${{ secrets.ALB_DNS }}/actuator/health`

**자동 롤백**
- 스모크 테스트 실패 시 이전 Task Definition ARN으로 ECS 서비스 복구
- 배포 시작 전 현재 Task Definition ARN을 변수로 저장해두어야 함

**Discord 알림**
- 배포 성공·실패 모두 알림 발송
- 내용: 결과 상태, 트리거한 커밋 메시지, 커밋 SHA

---

## 4. CD 워크플로 — 프론트엔드 (`cd-frontend.yml`)

**트리거**: main 브랜치 push, `paths: ['frontend/**']`

```
main 머지 (frontend/** 변경)
    │
    ▼
Node 설치 + npm 의존성 캐시 복원
    │
    ▼
npm ci
    │
    ▼
npm run build   (tsc -b && vite build → frontend/dist)
    │  실패 시 → 배포 중단
    ▼
aws s3 sync frontend/dist s3://${FRONTEND_S3_BUCKET} --delete
    │
    ▼
aws cloudfront create-invalidation
    --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
    │
    ├── 성공 → Discord 알림 (프론트 배포 성공 ✅)
    └── 실패 → Discord 알림 (프론트 배포 실패 ❌)
```

### 핵심 설정

**작업 디렉토리**: `frontend/` (`working-directory: frontend`)

**S3 동기화 (`--delete`)**
- 빌드 산출물(`frontend/dist`)로 버킷 내용을 통째로 교체
- 삭제된 파일은 S3에서도 함께 제거되어 stale 파일이 남지 않음

**CloudFront 캐시 무효화**
- `/*` 전체 경로 무효화 — 사용자가 새로고침 시 즉시 새 버전을 받도록 함
- 무효화는 요청 건당 비용이 거의 없으나(월 1,000건 무료), 빈번한 배포 시 비용 발생 가능 — MVP 단계에서는 무시 가능한 수준

**롤백 없음**
- 정적 파일 배포라 ECS처럼 헬스체크/롤링 배포 개념이 없음
- 배포 실패 시 직전 커밋으로 재배포(재실행)하면 즉시 복구 가능

> 백엔드(`cd.yml`)와 독립적으로 동작하므로, 프론트만 수정한 PR이 머지되어도 ECS 재배포는 발생하지 않는다 (그 반대도 동일).

---

## 5. GitHub Secrets 목록

### 현재 구현된 시크릿 (`cd.yml` — ECR 푸시까지)

| Secret 이름 | 내용 | 용도 |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `wooriteam-cicd` IAM 계정 | AWS 인증 |
| `AWS_SECRET_ACCESS_KEY` | `wooriteam-cicd` IAM 계정 | AWS 인증 |

`AWS_REGION`(`ap-northeast-2`)과 ECR 레포지토리 URI는 시크릿으로 등록하지 않는다.

- **AWS_REGION**: 워크플로 `env.AWS_REGION`에 고정값으로 선언 (`infra/variables.tf`의 기본값과 동일)
- **ECR 레포지토리 URI**: `aws ecr describe-repositories --repository-names wooriteam`으로 워크플로 실행 시점에 조회 (`infra/ecr.tf`의 레포지토리 이름은 `var.project_name` = `wooriteam`으로 고정)

> 위 조회를 위해 IAM 정책에 `ecr:DescribeRepositories` 권한이 필요하다 (infra.md 9번 `wooriteam-cicd` 인라인 정책의 ECR 액션 목록에 추가).

### 추후 추가 예정 (ECS 배포 / 프론트엔드 배포 구현 시)

| Secret 이름 | 내용 | 용도 | 사용 워크플로 |
|---|---|---|---|
| `ECS_CLUSTER` | `wooriteam-cluster` | 배포 대상 클러스터 | `cd.yml` |
| `ECS_SERVICE` | `wooriteam-service` | 배포 대상 서비스 | `cd.yml` |
| `ECS_TASK_DEFINITION` | `wooriteam-task` | Task Definition 이름 | `cd.yml` |
| `CONTAINER_NAME` | `wooriteam-app` | Task Definition 업데이트 | `cd.yml` |
| `ALB_DNS` | ALB DNS 주소 | 스모크 테스트 엔드포인트 | `cd.yml` |
| `FRONTEND_S3_BUCKET` | 프론트 S3 버킷 이름 | `aws s3 sync` 업로드 대상 | `cd-frontend.yml` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront 배포 ID | 캐시 무효화(`create-invalidation`) 대상 | `cd-frontend.yml` |
| `DISCORD_WEBHOOK` | Discord Webhook URL | 배포 알림 | `cd.yml`, `cd-frontend.yml` |

> 이 값들도 가능한 경우 `aws ecs describe-services` 등으로 동적 조회하거나 `env`에 고정값으로 선언해, 시크릿은 AWS 자격증명 2개 + Discord Webhook 정도로만 유지하는 방향을 권장한다.

> DB 자격증명·JWT secret·`CORS_ALLOWED_ORIGINS`은 GitHub Secrets에 저장하지 않는다. `DB_PASSWORD`·`JWT_SECRET`은 Secrets Manager에서 ECS가 직접 읽고, `CORS_ALLOWED_ORIGINS`은 `terraform.tfvars`/ECS 환경변수로 관리한다.

---

## 6. 구현 체크리스트

### GitHub Actions 파일 (`.github/workflows/`)

- [ ] `ci.yml` — PR 트리거, `paths-filter`로 백엔드/프론트엔드 job 분기
  - [ ] 백엔드 job: Gradle 캐시 + 빌드/테스트 + JaCoCo
  - [ ] 프론트엔드 job: npm 캐시 + lint + build (`frontend/` working-directory)
- [ ] `cd.yml` — main push 트리거 (백엔드 경로), Trivy 스캔 + ECR 푸시 + ECS 배포 + 스모크 테스트 + 롤백 + Discord 알림
- [ ] `cd-frontend.yml` — main push 트리거 (`frontend/**`), npm build + S3 sync + CloudFront 무효화 + Discord 알림

### `build.gradle` 수정

- [ ] `jacoco` 플러그인 추가
- [ ] `jacocoTestReport` 태스크 설정
- [ ] `jacocoTestCoverageVerification` 임계값 설정 (60%)

### GitHub 설정

- [ ] Secrets 등록 (위 목록 참고)
- [ ] main 브랜치 보호 규칙 설정
  - PR 필수 (직접 push 차단)
  - CI 통과 필수 (Status Check) — 변경 경로에 따라 실행되지 않은 job은 required check에서 제외하거나 `paths-filter`로 항상 success 처리되도록 구성

---

## 7. 우선순위

| 항목 | 효과 | 파일 |
|---|---|---|
| Gradle/npm 캐시 + PR CI 분리 | 빌드 속도↑, 코드 품질 보장 | `ci.yml` |
| 백엔드/프론트엔드 CD 분리 (`paths` 필터) | 불필요한 배포 방지 | `cd.yml`, `cd-frontend.yml` |
| Discord 알림 | 팀 가시성 확보 | `cd.yml`, `cd-frontend.yml` |
| 스모크 테스트 + 자동 롤백 | 백엔드 배포 안정성 | `cd.yml` |
| Trivy 이미지 스캔 | 보안 | `cd.yml` |
| JaCoCo 커버리지 게이트 | 코드 품질 | `build.gradle` + `ci.yml` |
| S3 sync + CloudFront 무효화 | 프론트엔드 배포 자동화 | `cd-frontend.yml` |