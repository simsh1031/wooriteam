# k6 부하테스트 결과 리포트

실행일: 2026-06-25
관련 스크립트: `k6/smoke.js`, `k6/load.js`, `k6/stress.js`, `k6/common.js`
관련 문서: `k6/README.md`, `docs/grafana-deploy.md`, `docs/grafana-dashboard.json`

## 1. 실행 환경

- `BASE_URL`을 ALB DNS(`wooriteam-alb-*.elb.amazonaws.com`)로 직접 지정해 실행했으나 모든 요청이 `403 Forbidden`(응답 헤더 `Server: awselb/2.0` — 백엔드에 도달하지 못하고 ALB 자체가 차단)으로 실패
  - 원인: `infra/alb.tf`에 설계된 "CloudFront 경유 트래픽만 허용" 정책. HTTP 리스너의 기본 동작은 `403 Forbidden` 고정 응답이고, `X-From-CloudFront` 커스텀 헤더(시크릿 값 일치)가 있는 요청만 타겟 그룹으로 forward됨
  - 조치: `terraform output cloudfront_domain_name`으로 확인한 CloudFront 배포 도메인(`d23r53j5as6ojz.cloudfront.net`)을 `BASE_URL`로 사용해 재실행
- CloudFront 라우팅 특성상 발생하는 제약 (`infra/cloudfront.tf`)
  - `/api/*` → ALB(`alba-backend` origin)로 forward — 실제 백엔드 응답을 검증
  - 그 외 모든 경로(`*`, 기본 동작) → S3(`s3-frontend` origin), 403/404는 `index.html` 200으로 매핑(SPA 라우팅 대응 `custom_error_response`)
  - 따라서 `/actuator/health`는 CloudFront 경유 시 ALB가 아니라 S3로 가서 **실제 Spring Boot 헬스 상태가 아니라 프론트엔드 정적 파일 응답**이 200으로 잡힘 → `smoke.js`의 `health is 200` 체크는 이번 실행에서 실질적인 백엔드 헬스 검증 효과가 제한적이었음 (별도 수정은 보류, ALB에 직접 `X-From-CloudFront` 헤더를 실어 보내는 방식으로 개선 가능)

## 2. 스크립트별 상세

### 2-1. `smoke.js` — 1단계: 기본 동작 확인

| 항목 | 내용 |
|---|---|
| 목적 | 핵심 엔드포인트가 "기본적으로 응답하는지"만 빠르게 확인 (배포 직후 1차 검증용) |
| 호출 API | `GET /actuator/health` (인증 불필요), `GET /api/posts` (인증 불필요, 공고 목록) |
| 부하 프로파일 | VU 3, 30초 고정 (ramp 없음) |
| 검증 지표 | 각 요청의 `status === 200` 체크, `http_req_duration`(p95), `http_req_failed`(에러율) |
| 임계값(thresholds) | `http_req_failed: rate==0` (에러 0건이어야 통과), `http_req_duration: p(95)<1000ms` |
| 측정하는 특성 | 인증 없이도 동작하는 가장 기초적인 read-only 엔드포인트 2개가, 부하가 거의 없는 상태에서 정상 응답하는지 — 장애 유무를 빠르게 가리는 게이트 역할 |

**결과**

- 체크 162/162 (100%) 통과, `http_req_failed` 0%
- `http_req_duration`: avg 65.06ms / med 35.99ms / p90 73.04ms / **p95 153.31ms** (기준 1000ms 대비 여유)
- 처리량 약 5.3 req/s (3 VU × 1초 간격 sleep 기준)

### 2-2. `load.js` — 2단계: 평상시 부하 시뮬레이션

| 항목 | 내용 |
|---|---|
| 목적 | 실제 서비스에서 기대하는 평상시 동시 사용자 수준의 부하를 일정 시간 유지했을 때 응답 시간·에러율이 안정적인지 확인 |
| 호출 API | `setup()`에서 1회: `POST /api/auth/signup`(이미 있으면 무시) → `POST /api/auth/login`(JWT 토큰 획득). 매 반복(iteration)마다: `GET /api/posts`(인증 헤더 미사용, 목록 조회) → 그중 무작위 1건의 `id`로 `GET /api/posts/{id}`(인증 헤더 포함, 상세 조회) |
| 부하 프로파일 | `ramping-vus` executor, 0 → 20 VU 30초간 증가 → 20 VU로 3분 유지 → 30초간 0으로 감소 (총 4분) |
| 검증 지표 | `GET /api/posts is 200`, `GET /api/posts/{id} is 200` 체크, `http_req_duration`(p95), `http_req_failed`(에러율) |
| 임계값(thresholds) | `http_req_failed: rate<0.01` (1% 미만), `http_req_duration: p(95)<800ms` |
| 측정하는 특성 | 목록 조회(컬렉션, 캐싱 안 됨 — `Managed-CachingDisabled` 정책)와 상세 조회(인증 포함, JWT 검증 비용 포함)를 함께 호출해 "둘러보기" 행동 패턴을 모사. 20명이 동시에 3분간 계속 사용해도 응답 지연이나 실패가 누적되지 않는지가 핵심 |

**결과**

- 체크 4090/4090 (100%) 통과, `http_req_failed` 0% (4091건 중 0건)
- `http_req_duration`: avg 28.56ms / med 26.62ms / p90 38.68ms / **p95 47.03ms** (기준 800ms 대비 큰 여유)
- 총 4091 요청, 처리량 약 16.8 req/s, 4089 iteration 완료

### 2-3. `stress.js` — 3단계: 한계 부하 및 Auto Scaling 트리거 확인

| 항목 | 내용 |
|---|---|
| 목적 | 평상시보다 훨씬 큰 동시 접속(최대 100 VU)을 줘서 ECS Auto Scaling(desired count 2→6)이 실제로 트리거되는지, RDS 커넥션이 한도(66개)를 넘지 않는지 관찰 |
| 호출 API | `setup()`에서 동일하게 회원가입/로그인. 매 반복마다 `GET /api/posts`(목록, 인증 헤더 미사용) → 무작위 1건 `GET /api/posts/{id}`(상세, 인증 헤더 포함, 단 응답을 체크하지 않고 발사만 함) |
| 부하 프로파일 | `ramping-vus` executor, 5단계: 0→50 VU(1분) → 50 VU 유지(3분) → 50→100 VU(1분) → 100 VU 유지(3분) → 100→0 VU(2분), 총 10분 |
| 검증 지표 | `GET /api/posts is 2xx` 체크(2xx 전체 허용, smoke/load보다 완화된 기준), `http_req_failed`(에러율)만 임계값으로 설정(응답시간 임계값 없음 — 한계 구간에서는 느려지는 것 자체보다 "죽지 않는지"가 관심사) |
| 임계값(thresholds) | `http_req_failed: rate<0.05` (5% 미만) |
| 측정하는 특성 | 목록 조회 API가 동시 사용자 100명 수준에서도 죽지 않고 5xx 폭증 없이 버티는지, 그리고 이 부하가 ECS CPU/메모리·RDS 커넥션에 어떤 압력을 주는지를 Grafana와 함께 관찰 |

**결과**

- 체크 74476/74477 (99.99%) 통과 — `GET /api/posts is 2xx` 1건만 실패
  - 실패 원인: `read tcp ...: wsarecv: A connection attempt failed because the connected party did not properly respond after a period of time` (k6 로컬 클라이언트 측 TCP 수신 타임아웃, 일시적 네트워크 지연으로 추정 — 서버가 명시적 에러를 반환한 것은 아님)
  - `http_req_failed` 0.00% (2/74478) — 임계값(`<5%`) 충분히 충족
- `http_req_duration`: avg 22.87ms / med 19.75ms / p90 29.87ms / **p95 37.55ms**
- 총 74478 요청, 처리량 약 123.9 req/s — load test(16.8 req/s) 대비 약 7.4배

### 2-4. 단계 간 비교

| 단계 | 최대 VU | 처리량(req/s) | p95 응답시간 | 에러율 |
|---|---|---|---|---|
| Smoke | 3 | 5.3 | 153.31ms | 0% |
| Load | 20 | 16.8 | 47.03ms | 0% |
| Stress | 100 | 123.9 | 37.55ms | 0.00%(1건/74478) |

부하(VU/처리량)가 커질수록 p95 응답시간이 오히려 153ms → 47ms → 37ms로 낮아지는 추세를 보였다. 이는 부하 증가가 응답시간을 개선한 것이 아니라, smoke test의 153ms가 테스트 초반 콜드 스타트성 변동(JVM JIT 워밍업, 최초 커넥션 풀 초기화 등)으로 부풀려진 값일 가능성이 높고, load/stress 단계에서는 이미 워밍업된 상태에서 안정적인 응답시간(30~50ms대)을 유지한 것으로 해석된다. 즉 현재 부하 규모(최대 100 VU)에서는 백엔드가 병목 없이 여유 있게 처리하고 있다.

## 3. Grafana 대시보드 분석 (`docs/img.png`)

k6 stress test 실행 구간을 Grafana 인프라 대시보드(`docs/grafana-dashboard.json`, ECS/ALB/RDS 9패널)로 대조 확인한 결과.

| 패널 | 관찰 내용 |
|---|---|
| ECS CPU Utilization | 테스트 구간에 ~80%까지 치솟는 스파이크가 두 번 발생 — load test, stress test 각각의 실행 시점과 일치 |
| ECS Memory Utilization | 테스트 시작 후 ~25%로 상승해 그 수준에서 안정적으로 유지, 메모리 압박 없음 |
| ALB Request Count | stress test(최대 100 VU) 구간에서 뚜렷한 단일 피크 — k6가 보고한 처리량 급증(123.9 req/s)과 일치 |
| ALB Target Response Time (Avg / p95) | 같은 피크 구간에서 짧게 상승했다가 회복 — 부하가 몰리는 짧은 시점에만 지연이 소폭 발생 |
| ALB 5XX Count | 1건 — k6 stress 결과의 단일 타임아웃(클라이언트 측 `wsarecv`)과 시점이 일치. 다만 ALB 5XX는 서버/ALB 측 응답 코드 기준이라, k6 쪽 타임아웃과 정확히 동일한 이벤트인지는 ALB 액세스 로그 대조가 필요 (현재는 시점 일치로만 추정) |
| RDS CPU Utilization | 낮은 수준 유지, 변화 거의 없음 |
| RDS Database Connections | 낮은 수준 유지 — 한도(66개)에 근접하지 않음 |
| RDS Free Storage Space | 거의 변화 없음 |

**종합**: 이번 부하 규모(최대 100 VU, 약 124 req/s)에서는 ECS CPU가 두 차례 80% 근처까지 올라간 것 외에는 ALB·RDS 모두 여유 있게 처리했다. RDS는 이번 테스트에서 병목 후보에서 제외할 수 있다.

### 미확인 사항

현재 대시보드 9패널에는 **ECS 태스크 수(desired/running count)** 패널이 없어, CPU가 ~80%까지 올라간 시점에 Auto Scaling이 실제로 desired count 2→6으로 트리거됐는지는 이 대시보드만으로 확인할 수 없다. `aws ecs describe-services --cluster wooriteam-cluster --services wooriteam-service`로 직접 조회하거나, 대시보드에 ECS 태스크 수 패널을 추가하는 작업이 후속으로 필요하다.

## 4. 다음에 할 일

- ECS 태스크 수(desired/running) 확인 — Auto Scaling 2→6 트리거 여부, 종료 후 2로 scale-in 되는지
- Grafana 대시보드에 ECS 태스크 수 패널 추가 (`docs/grafana-dashboard.json` 갱신)
- 필요 시 ALB 액세스 로그로 5XX 1건의 실제 원인(타임아웃 vs 서버 에러) 교차 확인
- `smoke.js`의 health check를 CloudFront가 아닌 ALB 직접 호출(`X-From-CloudFront` 헤더 포함)로 바꿔 실제 백엔드 헬스를 검증하도록 개선 검토