import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const TEST_EMAIL = __ENV.TEST_EMAIL || 'k6-load-test@wooriteam.test';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'k6LoadTest!23';

// 회원가입은 이미 있으면 실패(409 등)할 수 있으므로 무시하고 로그인만 검증한다.
export function ensureTestUser() {
  http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      nickname: 'k6-load-tester',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export function login() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, { 'login status is 200': (r) => r.status === 200 });

  return res.json('data.token');
}

export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}
