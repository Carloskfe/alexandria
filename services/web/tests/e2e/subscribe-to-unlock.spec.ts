import { test, expect } from '@playwright/test';

test.describe('Flow: subscribe → unlock', () => {
  test('pricing page shows plans and initiates checkout on selection', async ({ page }) => {
    // ── Mock subscription status — no active plan ─────────────────────────────
    await page.route('**/api/subscriptions/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ planId: null }),
      }),
    );

    // ── Mock checkout — returns Stripe URL ────────────────────────────────────
    let checkoutBody: { planId?: string } = {};
    await page.route('**/api/subscriptions/checkout', async (route) => {
      checkoutBody = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/pay/cs_test_mock' }),
      });
    });

    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible();

    // All four plan cards should render
    await expect(page.getByRole('heading', { name: 'Individual Monthly' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Individual Annual' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dual Reader Monthly' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dual Reader Annual' })).toBeVisible();

    // Click "Get started" on the first plan
    const checkoutRequest = page.waitForRequest(
      (req) => req.url().includes('/api/subscriptions/checkout') && req.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Get started' }).first().click();
    await checkoutRequest;

    // Checkout was called with a planId
    expect(checkoutBody.planId).toBe('individual-monthly');
  });

  test('current plan button is disabled', async ({ page }) => {
    await page.route('**/api/subscriptions/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ planId: 'individual-monthly' }),
      }),
    );

    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible();

    // The "Individual Monthly" card should show "Current plan" (disabled button)
    const currentPlanBtn = page.locator('.border.rounded-xl').filter({
      has: page.getByRole('heading', { name: 'Individual Monthly' }),
    }).getByRole('button');

    await expect(currentPlanBtn).toBeDisabled();
    await expect(currentPlanBtn).toHaveText('Current plan');
  });

  test('shows error when checkout fails', async ({ page }) => {
    await page.route('**/api/subscriptions/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ planId: null }) }),
    );

    await page.route('**/api/subscriptions/checkout', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) }),
    );

    await page.goto('/pricing');
    await page.getByRole('button', { name: 'Get started' }).first().click();

    await expect(page.getByText('Could not start checkout. Please try again.')).toBeVisible();
  });
});
