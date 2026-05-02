import { test, expect } from '@playwright/test';

const API = 'http://localhost:4000';
const BOOK_ID = 'book-e2e-2';

const MOCK_BOOK = {
  id: BOOK_ID,
  title: 'Cien años de soledad',
  author: 'García Márquez',
  audioFileUrl: null,
  audioStreamUrl: null,
  textFileUrl: null,
  isFree: false,
};

const MOCK_PHRASES = [
  { text: 'Muchos años después', startTime: 0, endTime: 2, type: 'sentence' },
  { text: 'frente al pelotón de fusilamiento', startTime: 2, endTime: 5, type: 'sentence' },
  { text: 'el coronel Aureliano Buendía', startTime: 5, endTime: 8, type: 'sentence' },
];

const MOCK_FRAGMENT = {
  id: 'frag-e2e-1',
  bookId: BOOK_ID,
  text: 'Muchos años después',
  note: null,
  createdAt: '2026-05-02T00:00:00Z',
};

test.describe('Flow: highlight → share', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/books/${BOOK_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOOK),
      }),
    );
    await page.route(`${API}/books/${BOOK_ID}/sync-map`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ phrases: MOCK_PHRASES }),
      }),
    );
    await page.route(`${API}/books/${BOOK_ID}/progress`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ phraseIndex: 0 }) }),
    );
    await page.route(`${API}/books/${BOOK_ID}/fragments`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
  });

  test('user selects text, saves fragment, and sees counter increment', async ({ page }) => {
    await page.route(`${API}/fragments`, (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FRAGMENT),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`/reader/${BOOK_ID}`);
    await expect(page.getByRole('heading', { name: 'Cien años de soledad' })).toBeVisible();
    await expect(page.getByText('Muchos años después')).toBeVisible();

    // Simulate text selection on the first phrase
    const firstPhrase = page.locator('span[data-phrase-index="0"]');
    await firstPhrase.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    });

    // Fragment popover should appear with save button
    await expect(page.getByRole('button', { name: 'Guardar fragmento' })).toBeVisible();

    // Save the fragment — wait for the POST /fragments call
    const fragmentRequest = page.waitForRequest(
      (req) => req.url().includes('/fragments') && req.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Guardar fragmento' }).click();
    await fragmentRequest;

    // Popover should disappear
    await expect(page.getByRole('button', { name: 'Guardar fragmento' })).not.toBeVisible();

    // Fragment count badge in top bar should show 1
    const fragmentsBtn = page.getByRole('button', { name: 'Fragmentos' });
    await expect(fragmentsBtn.locator('span').filter({ hasText: '1' })).toBeVisible();
  });

  test('fragment sheet opens and shows saved fragment text', async ({ page }) => {
    // Pre-load with one existing fragment
    await page.route(`${API}/books/${BOOK_ID}/fragments`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_FRAGMENT]),
      }),
    );

    await page.goto(`/reader/${BOOK_ID}`);
    await expect(page.getByRole('heading', { name: 'Cien años de soledad' })).toBeVisible();

    // Open fragment sheet via top bar
    await page.getByRole('button', { name: 'Fragmentos' }).click();

    // Sheet header and fragment text should be visible
    await expect(page.getByRole('heading', { name: 'Fragmentos' })).toBeVisible();
    await expect(page.getByText('Muchos años después')).toBeVisible();
  });

  test('share modal opens from fragment sheet', async ({ page }) => {
    await page.route(`${API}/books/${BOOK_ID}/fragments`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_FRAGMENT]),
      }),
    );

    await page.goto(`/reader/${BOOK_ID}`);
    await expect(page.getByRole('heading', { name: 'Cien años de soledad' })).toBeVisible();

    // Open fragment sheet
    await page.getByRole('button', { name: 'Fragmentos' }).click();
    await expect(page.getByText('Muchos años después')).toBeVisible();

    // Click share on the fragment
    await page.getByRole('button', { name: 'Compartir fragmento' }).click();

    // Share modal (Crear tarjeta) should appear
    await expect(page.getByRole('heading', { name: 'Crear tarjeta' })).toBeVisible();
  });
});
