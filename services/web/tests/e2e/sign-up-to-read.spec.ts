import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000';

const MOCK_BOOK = {
  id: 'book-e2e-1',
  title: 'El Quijote',
  author: 'Cervantes',
  audioFileUrl: null,
  audioStreamUrl: null,
  textFileUrl: null,
  isFree: true,
};

const MOCK_PHRASES = [
  { text: 'En un lugar de la Mancha', startTime: 0, endTime: 3, type: 'sentence' },
  { text: 'de cuyo nombre no quiero acordarme', startTime: 3, endTime: 6, type: 'sentence' },
];

test.describe('Flow: sign-up → read', () => {
  test('user registers, lands in library, and opens reader', async ({ page }) => {
    // ── Mock register endpoint ────────────────────────────────────────────────
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'e2e-token-abc',
          user: { id: 'u1', name: 'Test User', userType: 'reader' },
        }),
      }),
    );

    // ── Mock library endpoint ─────────────────────────────────────────────────
    await page.route(`${API}/library`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_BOOK]),
      }),
    );

    // ── Mock book details for reader ──────────────────────────────────────────
    await page.route(`${API}/books/${MOCK_BOOK.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOK),
      }),
    );

    await page.route(`${API}/books/${MOCK_BOOK.id}/sync-map`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ phrases: MOCK_PHRASES }),
      }),
    );

    await page.route(`${API}/books/${MOCK_BOOK.id}/progress`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ phraseIndex: 0 }) }),
    );

    await page.route(`${API}/books/${MOCK_BOOK.id}/fragments`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    await page.route(`${API}/library/${MOCK_BOOK.id}`, (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({}) }),
    );

    // ── Step 1: navigate to register ─────────────────────────────────────────
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // ── Step 2: fill and submit the form ──────────────────────────────────────
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@noetia.com');
    await page.getByLabel('Password').fill('secure-password-123');
    await page.getByRole('button', { name: 'Create account' }).click();

    // ── Step 3: redirected to library ─────────────────────────────────────────
    await page.waitForURL(/\/library/);

    // ── Step 4: navigate to reader and verify it loads ────────────────────────
    await page.goto(`/reader/${MOCK_BOOK.id}`);
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeVisible();
    await expect(page.getByText('En un lugar de la Mancha')).toBeVisible();
  });

  test('shows validation errors when form is submitted empty', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Invalid email')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('shows server error when registration fails', async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already in use' }),
      }),
    );

    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('taken@noetia.com');
    await page.getByLabel('Password').fill('secure-password-123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Email already in use')).toBeVisible();
  });
});
