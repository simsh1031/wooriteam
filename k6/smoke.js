// 1단계: Smoke test — 핵심 엔드포인트가 기본적으로 응답하는지만 확인
// 실행: k6 run -e BASE_URL=http://<ALB_DNS> k6/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './common.js';

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/actuator/health`);
  check(health, { 'health is 200': (r) => r.status === 200 });

  const posts = http.get(`${BASE_URL}/api/posts`);
  check(posts, { 'posts is 200': (r) => r.status === 200 });

  sleep(1);
}
