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

function withNoMutations(routeHandler: (route: Route) => Promise<void>, onMutation: (details: { operationName?: string }) => void) {
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
  test('Request Review navigates to review queue and sends no GraphQL mutations', async ({ page }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withNoMutations(setupGraphQLMocks, ({ operationName }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
      })
    );

    await login(page);

    await page.goto('/claims/compare?base=claim-1&with=claim-2');
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Claim 2')).toBeVisible();

    await page.getByRole('button', { name: /request review/i }).click();
    await expect(page.getByRole('dialog', { name: /request human review/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Requesting review does not resolve or modify claims/i)).toBeVisible();
    await expect(page.getByText(/no data is persisted/i)).toBeVisible();

    await page.getByRole('button', { name: /go to review queue/i }).click();
    await page.waitForURL(/\/review-queue\?/, { timeout: 20_000 });

    // Queue view is explicit about non-truth semantics.
    await expect(
      page.getByText('Reviewer queues are a coordination aid. They do not change claim status or truth.')
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Review Requested (Not Yet Assigned)').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Source:\s*Comparison/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Test Entity is mentioned in Getting Started\./i)).toBeVisible({ timeout: 20_000 });

    const nonAuthMutations = mutations.filter((op) => !['Login', 'Register', 'ChangePassword', 'ForgotPassword'].includes(op));
    expect(nonAuthMutations).toHaveLength(0);
  });
});

