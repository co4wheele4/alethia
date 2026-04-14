import { test, expect, type Page, type Route } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('admin@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

async function createCoordinationOnlyReviewRequestViaComparison(page: Page) {
  // Create a review request (coordination-only) so it appears in the queue.
  await page.goto('/claims/compare?base=claim-1&with=claim-2');
  await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: /request review/i }).click();
  await expect(page.getByRole('dialog', { name: /request human review/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/do not change truth or claim status/i)).toBeVisible();
  await page.getByRole('button', { name: /^request review$/i }).click();

  await page.waitForURL(/\/review-queue$/, { timeout: 20_000 });
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

function overrideAssignReviewerError(args: { code: 'DUPLICATE_ASSIGNMENT' | 'UNAUTHORIZED' }) {
  return async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (!url.includes('/graphql') || method !== 'POST') {
      await setupGraphQLMocks(route);
      return;
    }

    const bodyText = (await route.request().postData()) ?? '';
    // Be extremely permissive here: Playwright route overrides should not depend on
    // Apollo's exact request JSON shape.
    const isAssignReviewer = /\bassignReviewer\b/i.test(bodyText) || /\bAssignReviewer\b/.test(bodyText);

    if (isAssignReviewer) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { assignReviewer: null },
          errors: [{ message: args.code, extensions: { code: args.code } }],
        }),
      });
      return;
    }

    await setupGraphQLMocks(route);
  };
}

test.describe('Reviewer assignment (coordination only)', () => {
  test('assignment persists across reload without changing claim.status', async ({ page }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withMutationAudit(setupGraphQLMocks, ({ operationName, query }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
        if (/\badjudicateClaim\b/i.test(String(query ?? ''))) {
          throw new Error('[E2E] adjudicateClaim must never be invoked from reviewer coordination surfaces');
        }
      }),
    );

    await loginAsAdmin(page);

    // Baseline: claim status is stable before any coordination actions.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    await createCoordinationOnlyReviewRequestViaComparison(page);

    // Mandatory ADR-015 disclaimer must be visible.
    await expect(
      page.getByText('Assignment coordinates attention. It does not change truth or claim status.'),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText('Review requests coordinate attention. They do not change truth or claim status.'),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(
        /This queue is read-only\. Requests coordinate review handoff; they do not record adjudication outcomes or change\s+claim status here\./,
      ),
    ).toBeVisible({ timeout: 20_000 });

    // Assign to self (coordination only) and ensure it renders as "you".
    await page.getByRole('button', { name: 'Assign to me (coordination only)' }).first().click();
    await expect(page.locator('[aria-label="Assigned to you"]')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('[aria-label="Assigned to you"]').getByText('Assigned (coordination only)').first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Assigned \(coordination only\):\s*you/i).first()).toBeVisible({ timeout: 20_000 });

    // Persistence across reload: assignment remains and is still rendered.
    await page.reload();
    await expect(page.locator('[aria-label="Assigned to you"]')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('[aria-label="Assigned to you"]').getByText('Assigned (coordination only)').first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Assigned \(coordination only\):\s*you/i).first()).toBeVisible({ timeout: 20_000 });

    // Claim status unchanged after assignment.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    // Assert that no truth-adjacent mutation (e.g. adjudication) was invoked.
    const allowed = new Set([
      'Login',
      'Register',
      'ChangePassword',
      'ForgotPassword',
      'RequestReview',
      'AssignReviewer',
      'RespondToReviewAssignment',
    ]);
    const forbidden = mutations.filter((op) => !allowed.has(op));
    expect(forbidden).toHaveLength(0);
  });

  test('reviewer acknowledges assignment; response persists; claim.status unchanged; adjudicateClaim never called', async ({ page }) => {
    test.setTimeout(60_000);

    const mutations: string[] = [];
    await page.route(
      '**/graphql',
      withMutationAudit(setupGraphQLMocks, ({ operationName, query }) => {
        mutations.push(String(operationName ?? '(missing operationName)'));
        if (/\badjudicateClaim\b/i.test(String(query ?? ''))) {
          throw new Error('[E2E] adjudicateClaim must never be invoked from reviewer coordination surfaces');
        }
      }),
    );

    await loginAsAdmin(page);

    // Baseline status before coordination actions.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    await createCoordinationOnlyReviewRequestViaComparison(page);

    // Mandatory ADR-016 disclaimer must be visible.
    await expect(
      page.getByText('Reviewer responses coordinate attention. They do not determine truth or claim status.'),
    ).toBeVisible({ timeout: 20_000 });

    // Assign to self so the current user is the assigned reviewer (coordination only).
    await page.getByRole('button', { name: 'Assign to me (coordination only)' }).first().click();
    await expect(page.locator('[aria-label="Assigned to you"]')).toBeVisible({ timeout: 20_000 });

    // Acknowledge and ensure UI disables further responses.
    const assigned = page.locator('[aria-label="Assigned to you"]').first();
    const acknowledge = assigned.getByRole('button', { name: 'Acknowledge' }).first();
    const decline = assigned.getByRole('button', { name: 'Decline' }).first();

    await acknowledge.click();
    await expect(assigned.getByText('Acknowledged (coordination only)')).toBeVisible({ timeout: 20_000 });
    await expect(acknowledge).toBeDisabled();
    await expect(decline).toBeDisabled();

    // Persistence across reload: response remains visible.
    await page.reload();
    await expect(page.locator('[aria-label="Assigned to you"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Acknowledged (coordination only)').first()).toBeVisible({ timeout: 20_000 });

    // Claim status unchanged after response.
    await page.goto('/claims/claim-1');
    await expect(page.getByTestId('claim-state')).toContainText(/draft/i, { timeout: 20_000 });

    // Assert that no truth-adjacent mutation (e.g. adjudication) was invoked.
    const allowed = new Set([
      'Login',
      'Register',
      'ChangePassword',
      'ForgotPassword',
      'RequestReview',
      'AssignReviewer',
      'RespondToReviewAssignment',
    ]);
    const forbidden = mutations.filter((op) => !allowed.has(op));
    expect(forbidden).toHaveLength(0);
  });

  test('duplicate assignment surfaces DUPLICATE_ASSIGNMENT', async ({ page }) => {
    test.setTimeout(60_000);

    await page.route('**/graphql', overrideAssignReviewerError({ code: 'DUPLICATE_ASSIGNMENT' }));
    await loginAsAdmin(page);
    await createCoordinationOnlyReviewRequestViaComparison(page);

    await page.getByRole('button', { name: 'Assign to me (coordination only)' }).first().click();
    await expect(page.getByText(/\[DUPLICATE_ASSIGNMENT\]/)).toBeVisible({ timeout: 20_000 });
  });

  test('unauthorized assignment surfaces UNAUTHORIZED', async ({ page }) => {
    test.setTimeout(60_000);

    await page.route('**/graphql', overrideAssignReviewerError({ code: 'UNAUTHORIZED' }));
    await loginAsAdmin(page);
    await createCoordinationOnlyReviewRequestViaComparison(page);

    await page.getByRole('button', { name: 'Assign to me (coordination only)' }).first().click();
    await expect(page.getByText(/\[UNAUTHORIZED\]/)).toBeVisible({ timeout: 20_000 });
  });
});

