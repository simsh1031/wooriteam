// 3단계: Stress test — ECS Auto Scaling(desired 2→6) 트리거와 RDS 커넥션 한도 확인용
// 실행: k6 run -e BASE_URL=http://<ALB_DNS> k6/stress.js
// 실행 중 Grafana ECS 대시보드(23)·RDS 대시보드(707)로 CPU/커넥션 수를 같이 관찰할 것
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ensureTestUser, login, authHeaders } from './common.js';

export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
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
  check(list, { 'GET /api/posts is 2xx': (r) => r.status >= 200 && r.status < 300 });

  const posts = list.json('data');
  if (Array.isArray(posts) && posts.length > 0) {
    const id = posts[Math.floor(Math.random() * posts.length)].id;
    http.get(`${BASE_URL}/api/posts/${id}`, opts);
  }

  sleep(0.5);
}
