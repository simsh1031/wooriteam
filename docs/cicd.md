# 우리팀 CI/CD 설계

> GitHub Actions 기반 2-워크플로 구조. PR 단계에서 품질을 검증하고, main 머지 후 자동 배포한다.

---

## 1. 워크플로 구조

```
PR 오픈/업데이트          main 브랜치 머지
─────────────────         ─────────────────
.github/workflows/        .github/workflows/
  ci.yml                    cd.yml
```

### 기존 설계와의 차이

기존 infra.md 10번 계획은 `push to main → 즉시 배포`의 단선 구조였다.
개선 방향은 CI와 CD를 분리해 **PR 단계에서 문제를 먼저 잡고**, 배포 후에는 자동으로 이상을 감지한다.

---

## 2. CI 워크플로 (`ci.yml`)

**트리거**: PR 오픈·커밋 푸시 (main 브랜치 대상 PR)

```
PR 생성 / 커밋 푸시
        │
        ▼
Gradle 의존성 캐시 복원
        │
        ▼
./gradlew build test
        │  실패 시 → PR 머지 차단
        ▼
./gradlew jacocoTestCoverageVerification   ← build.gradle 설정 필요
        │  커버리지 60% 미만 시 → PR 머지 차단
        ▼
CI 통과 (PR 머지 가능 상태)
```

### 핵심 설정

**Gradle 빌드 캐시**
- 매 실행마다 의존성을 새로 다운로드하지 않도록 캐시
- `*.gradle*` 파일 해시 기반으로 캐시 키 생성
- 빌드 시간 약 60% 단축 효과

**JaCoCo 커버리지 게이트**
- 설정 위치: `build.gradle` (jacocoTestCoverageVerification 태스크)
- 임계값: 전체 라인 커버리지 60% 미만 시 CI 실패
- CI에서는 `./gradlew test jacocoTestCoverageVerification` 순서로 실행

---

## 3. CD 워크플로 (`cd.yml`)

**트리거**: main 브랜치 push (PR 머지)

```
main 머지
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

**자동 롤백**
- 스모크 테스트 실패 시 이전 Task Definition ARN으로 ECS 서비스 복구
- 배포 시작 전 현재 Task Definition ARN을 변수로 저장해두어야 함

**Discord 알림**
- 배포 성공·실패 모두 알림 발송
- 내용: 결과 상태, 트리거한 커밋 메시지, 커밋 SHA

---

## 4. GitHub Secrets 목록

| Secret 이름 | 내용 | 용도 |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | CI/CD 전용 IAM 계정 | AWS 인증 |
| `AWS_SECRET_ACCESS_KEY` | CI/CD 전용 IAM 계정 | AWS 인증 |
| `AWS_REGION` | ap-northeast-2 | AWS 리전 |
| `ECR_REPOSITORY` | ECR 레포지토리 URI | 이미지 푸시 |
| `ECS_CLUSTER` | ECS 클러스터 이름 | 배포 대상 |
| `ECS_SERVICE` | ECS 서비스 이름 | 배포 대상 |
| `ECS_TASK_DEFINITION` | Task Definition 이름 | 배포 대상 |
| `CONTAINER_NAME` | 컨테이너 이름 | Task Definition 업데이트 |
| `ALB_DNS` | ALB DNS 주소 | 스모크 테스트 엔드포인트 |
| `DISCORD_WEBHOOK` | Discord Webhook URL | 배포 알림 |

> DB 자격증명·JWT secret은 GitHub Secrets에 저장하지 않음. Secrets Manager에서 ECS가 직접 읽어감.

---

## 5. 구현 체크리스트

### GitHub Actions 파일 (`.github/workflows/`)

- [ ] `ci.yml` — PR 트리거, Gradle 캐시 + 빌드/테스트 + JaCoCo
- [ ] `cd.yml` — main push 트리거, Trivy 스캔 + ECR 푸시 + ECS 배포 + 스모크 테스트 + 롤백 + Discord 알림

### `build.gradle` 수정

- [ ] `jacoco` 플러그인 추가
- [ ] `jacocoTestReport` 태스크 설정
- [ ] `jacocoTestCoverageVerification` 임계값 설정 (60%)

### GitHub 설정

- [ ] Secrets 등록 (위 목록 참고)
- [ ] main 브랜치 보호 규칙 설정
  - PR 필수 (직접 push 차단)
  - CI 통과 필수 (Status Check)

---

## 6. 우선순위

| 항목 | 효과 | 파일 |
|---|---|---|
| Gradle 캐시 + PR CI 분리 | 빌드 속도↑, 코드 품질 보장 | `ci.yml` |
| Discord 알림 | 팀 가시성 확보 | `cd.yml` |
| 스모크 테스트 + 자동 롤백 | 배포 안정성 | `cd.yml` |
| Trivy 이미지 스캔 | 보안 | `cd.yml` |
| JaCoCo 커버리지 게이트 | 코드 품질 | `build.gradle` + `ci.yml` |