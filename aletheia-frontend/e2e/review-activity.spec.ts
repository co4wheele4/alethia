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
  onMutation: (details: { operationName?: string; query?: string }) => void,
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
    if (isMutation) onMutation({ operationName: parsed.operationName, query });

    await routeHandler(route);
  };
}

test.describe('Review activity visibility (read-only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('claim view: renders coordination-only review activity; reload preserves visibility; claim.status unchanged; adjudicateClaim never called', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withMutationAudit(setupGraphQLMocks, ({ operationName, query }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
        if (/\badjudicateClaim\b/i.test(String(query ?? ''))) {
          throw new Error('[E2E] adjudicateClaim must never be invoked from review activity visibility surfaces');
        }
      }),
    );

    await login(page);

    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    // Expand the panel (collapsed by default).
    await page.getByTestId('review-activity-panel').click();

    await expect(page.getByTestId('review-activity-disclaimer')).toContainText(
      'Review activity records coordination only.',
    );
    await expect(page.getByTestId('review-activity-disclaimer')).toContainText(
      'It does not determine truth, correctness, or claim status.',
    );

    // Seeded coordination-only record should render with source + assignment + response.
    await expect(page.getByTestId('review-activity-sources')).toContainText('Comparison (1)');
    await expect(page.getByText('Review request')).toBeVisible();
    await expect(page.getByText('Reviewer User (reviewer@example.com)')).toBeVisible();
    await expect(page.getByText(/reviewerUserId:\s*user-3/i)).toBeVisible();
    await expect(page.getByText('ACKNOWLEDGED')).toBeVisible();

    // Reload and ensure the panel still renders the same coordination-only content.
    await page.reload();
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });
    await page.getByTestId('review-activity-panel').click();
    await expect(page.getByTestId('review-activity-disclaimer')).toContainText('Review activity records coordination only.');
    await expect(page.getByText('ACKNOWLEDGED')).toBeVisible();

    // Only auth/login mutation is expected here; no claim lifecycle mutations.
    const allowed = new Set(['Login', 'Register', 'ChangePassword', 'ForgotPassword']);
    const forbidden = mutations.filter((op) => !allowed.has(op));
    expect(forbidden).toHaveLength(0);
  });

  test('comparison view: indicator + details render; reload preserves visibility; claim.status unchanged; adjudicateClaim never called', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withMutationAudit(setupGraphQLMocks, ({ operationName, query }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
        if (/\badjudicateClaim\b/i.test(String(query ?? ''))) {
          throw new Error('[E2E] adjudicateClaim must never be invoked from review activity visibility surfaces');
        }
      }),
    );

    await login(page);

    await page.goto('/claims/compare?base=claim-1&with=claim-2');
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });

    // Indicator: count is visible.
    await expect(page.getByRole('button', { name: /review activity\s*\(1\)/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /review activity/i }).click();

    await expect(page.getByText('Review activity (coordination only)')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('review-activity-disclaimer')).toContainText('Review activity records coordination only.');
    await expect(page.getByText('ACKNOWLEDGED')).toBeVisible();

    await page.getByRole('button', { name: /^close$/i }).click();

    // Reload and ensure indicator + details still work.
    const urlBefore = page.url();
    await page.reload();
    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByRole('button', { name: /review activity\s*\(1\)/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /review activity/i }).click();
    await expect(page.getByText('ACKNOWLEDGED')).toBeVisible();

    // Claim status unchanged.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    const allowed = new Set(['Login', 'Register', 'ChangePassword', 'ForgotPassword']);
    const forbidden = mutations.filter((op) => !allowed.has(op));
    expect(forbidden).toHaveLength(0);
  });
});

