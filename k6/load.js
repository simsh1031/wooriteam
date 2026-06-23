// 2단계: Load test — 평상시 부하에서 응답 시간/에러율 확인
// 실행: k6 run -e BASE_URL=http://<ALB_DNS> k6/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ensureTestUser, login, authHeaders } from './common.js';

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function setup() {
  ensureTestUser();
  const token = login();
  return { token };
}

export default function (data) {
  const opts = authHeaders(data.token);

  const list = http.get(`${BASE_URL}/api/posts`);
  check(list, { 'GET /api/posts is 200': (r) => r.status === 200 });

  const posts = list.json('data');
  if (Array.isArray(posts) && posts.length > 0) {
    const id = posts[Math.floor(Math.random() * posts.length)].id;
    const detail = http.get(`${BASE_URL}/api/posts/${id}`, opts);
    check(detail, { 'GET /api/posts/{id} is 200': (r) => r.status === 200 });
  }

  sleep(1);
}
