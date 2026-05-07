/**
 * Noetia load test — reader flow
 *
 * Simulates the primary user journey:
 *   1. Browse catalog
 *   2. Open a book (presigned URL generation)
 *   3. Load sync-map (heaviest response — thousands of phrases)
 *   4. Save reading progress
 *   5. Load fragments
 *
 * Run:
 *   k6 run scripts/load-test/reader.js               # full 500 VU test
 *   k6 run --vus 10 --duration 30s reader.js          # quick smoke
 *
 * Targets:
 *   http_req_failed   < 1%
 *   http_req_duration p95 < 500ms
 *   sync_map_duration p95 < 800ms
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate        = new Rate('errors');
const syncMapDuration  = new Trend('sync_map_duration', true);
const bookDetailDuration = new Trend('book_detail_duration', true);

const BASE  = __ENV.BASE_URL || 'http://localhost:4000';
const WEB   = __ENV.WEB_URL  || 'http://localhost:3000';
const EMAIL = __ENV.TEST_EMAIL || 'loadtest@noetia.test';
const PASS  = 'Load1234!';

export const options = {
  scenarios: {
    readers: {
      executor: 'ramping-vus',
      exec: 'readerScenario',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50  },
        { duration: '60s', target: 500 },
        { duration: '60s', target: 500 },
        { duration: '30s', target: 0   },
      ],
      gracefulRampDown: '10s',
    },
    anonymous: {
      executor: 'constant-vus',
      exec: 'anonymousScenario',
      vus: 20,
      duration: '3m',
    },
  },
  thresholds: {
    http_req_failed:    ['rate<0.01'],
    http_req_duration:  ['p(95)<500'],
    sync_map_duration:  ['p(95)<800'],
    book_detail_duration: ['p(95)<300'],
  },
};

// ── Setup: register + fetch catalog once ────────────────────────────────────

export function setup() {
  // Ensure the test user exists
  http.post(`${BASE}/auth/register`,
    JSON.stringify({ name: 'Load Tester', email: EMAIL, password: PASS }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const loginRes = http.post(`${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASS }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (loginRes.status !== 200) {
    console.error(`Setup login failed: ${loginRes.status} ${loginRes.body}`);
    return { token: null, bookIds: [] };
  }

  const token = JSON.parse(loginRes.body).accessToken;
  const authH = { headers: { Authorization: `Bearer ${token}` } };

  const booksRes = http.get(`${BASE}/books?isFree=true`, authH);
  const bookIds = booksRes.status === 200
    ? JSON.parse(booksRes.body).slice(0, 10).map((b) => b.id)
    : [];

  console.log(`Setup: ${bookIds.length} books loaded`);
  return { token, bookIds };
}

// ── Reader scenario (authenticated) ─────────────────────────────────────────

export function readerScenario(data) {
  const { token, bookIds } = data;
  if (!token || !bookIds.length) return;

  const authH = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  const bookId = bookIds[Math.floor(Math.random() * bookIds.length)];

  group('browse', () => {
    const r = http.get(`${BASE}/books`, authH);
    check(r, { 'catalog 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(0.5 + Math.random() * 0.5);

  group('open_book', () => {
    const t0 = Date.now();
    const r = http.get(`${BASE}/books/${bookId}`, authH);
    bookDetailDuration.add(Date.now() - t0);
    check(r, { 'book 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(0.3);

  group('sync_map', () => {
    const t0 = Date.now();
    const r = http.get(`${BASE}/books/${bookId}/sync-map`, authH);
    syncMapDuration.add(Date.now() - t0);
    check(r, {
      'sync-map 200': (r) => r.status === 200,
      'has phrases':  (r) => { try { return JSON.parse(r.body).phrases?.length > 0; } catch { return false; } },
    });
    errorRate.add(r.status !== 200);
  });

  sleep(1.5 + Math.random() * 1); // simulate reading

  group('save_progress', () => {
    const r = http.post(
      `${BASE}/books/${bookId}/progress`,
      JSON.stringify({ phraseIndex: Math.floor(Math.random() * 200) }),
      authH,
    );
    check(r, { 'progress saved': (r) => r.status === 200 || r.status === 201 });
    errorRate.add(r.status >= 400);
  });

  sleep(0.2);

  group('fragments', () => {
    const r = http.get(`${BASE}/books/${bookId}/fragments`, authH);
    check(r, { 'fragments 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(0.5 + Math.random() * 0.5);
}

// default = readerScenario (used when running with --vus / --duration flags)
export default readerScenario;

// ── Anonymous scenario ────────────────────────────────────────────────────────

export function anonymousScenario() {
  group('public_books', () => {
    const r = http.get(`${BASE}/books`);
    check(r, { 'books 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(0.5);

  group('collections', () => {
    const r = http.get(`${BASE}/collections`);
    check(r, { 'collections 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(0.5);

  group('landing_page', () => {
    const r = http.get(`${WEB}/`);
    check(r, { 'landing 200': (r) => r.status === 200 });
    errorRate.add(r.status !== 200);
  });

  sleep(1);
}
