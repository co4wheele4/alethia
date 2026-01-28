import { test, expect, type Page, type Route } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function login(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

function withMutationAudit(
  routeHandler: (route: Route) => Promise<void>,
  onMutation: (details: { operationName?: string }) => void,
) {
  return async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (!url.includes('/graphql') || method !== 'POST') {
      await routeHandler(route);
      return;
    }

    const body = await route.request().postData();
    const parsed: { operationName?: string; query?: string } = body ? JSON.parse(body) : {};
    const query = typeof parsed.query === 'string' ? parsed.query : '';
    const isMutation = /\bmutation\b/.test(query);
    if (isMutation) onMutation({ operationName: parsed.operationName });

    await routeHandler(route);
  };
}

test.describe('Claims: comparison → request review (non-mutating)', () => {
  test('Request Review persists and survives reload (no claim status change)', async ({ page }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withMutationAudit(setupGraphQLMocks, ({ operationName }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
      })
    );

    await login(page);

    // Baseline: claim status is visible and stable.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    await page.goto('/claims/compare?base=claim-1&with=claim-2');
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Claim 2')).toBeVisible();

    await page.getByRole('button', { name: /request review/i }).click();
    await expect(page.getByRole('dialog', { name: /request human review/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Requesting review does not resolve or modify claims/i)).toBeVisible();
    await expect(page.getByText(/do not change truth or claim status/i)).toBeVisible();

    await page.getByRole('button', { name: /^request review$/i }).click();
    await page.waitForURL(/\/review-queue$/, { timeout: 20_000 });

    // Queue view is explicit about non-truth semantics.
    await expect(
      page.getByText('Review requests coordinate attention. They do not change truth or claim status.')
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Comparison' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Source:\s*Comparison/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Requested by:\s*Test User/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /view claim/i }).first()).toHaveAttribute('href', /\/claims\/claim-1/);

    // Persistence across reload: the queue item remains.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Comparison' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Requested by:\s*Test User/i).first()).toBeVisible({ timeout: 20_000 });

    // Claim status unchanged after requesting review.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    const allowed = new Set(['Login', 'Register', 'ChangePassword', 'ForgotPassword', 'RequestReview']);
    const forbidden = mutations.filter((op) => !allowed.has(op));
    expect(forbidden).toHaveLength(0);
  });
});

