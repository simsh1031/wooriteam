# k6 부하테스트

`docs/todo.md`의 "부하 테스트" 항목과 1:1로 대응한다.

## 설치

```bash
# Windows (winget)
winget install k6 --source winget

# macOS
brew install k6
```

## 실행

```bash
# 1단계 — Smoke test
k6 run -e BASE_URL=http://<ALB_DNS> k6/smoke.js

# 2단계 — Load test
k6 run -e BASE_URL=http://<ALB_DNS> k6/load.js

# 3단계 — Stress test (Auto Scaling 트리거 확인)
k6 run -e BASE_URL=http://<ALB_DNS> k6/stress.js
```

`BASE_URL`을 생략하면 `http://localhost:8080`(로컬 `bootRun`)으로 동작한다.

`TEST_EMAIL`, `TEST_PASSWORD` 환경변수로 부하테스트 전용 계정을 지정할 수 있다 (지정하지 않으면 `k6-load-test@wooriteam.test` 계정을 자동 생성·재사용).

## 결과 확인

- 콘솔에 출력되는 `http_req_duration`(p95), `http_req_failed`(에러율) 요약 확인
- 동시에 Grafana 대시보드로 관찰:
  - ECS (`23`) — CPU/메모리, 태스크 수 변화 (Auto Scaling 2→6 여부)
  - RDS (`707`) — 커넥션 수가 66개를 넘지 않는지

## 테스트 후 정리

- `k6-load-test@wooriteam.test` 계정으로 생성된 더미 데이터는 운영 DB라면 정리, 아니라면 무시 가능
- Auto Scaling이 desired_count(2)로 다시 줄어드는지(scale-in) 확인
