import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('alice@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

test.describe('Claims: review (single-claim)', () => {
  // These tests mutate seeded DB state; keep them isolated/deterministic.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Adjudication E2E runs only in Chromium');
  test.describe.configure({ mode: 'serial' });

  test('adjudicateClaim error codes are contract-stable', async ({ page }) => {
    test.setTimeout(60_000);

    const mutation = `
      mutation AdjudicateClaim($claimId: ID!, $decision: ClaimLifecycleState!, $reviewerNote: String) {
        adjudicateClaim(claimId: $claimId, decision: $decision, reviewerNote: $reviewerNote) {
          id
        }
      }
    `;

    const gqlUrl = 'http://127.0.0.1:3050/graphql';

    // UNAUTHORIZED_REVIEWER
    {
      const res = await page.request.post(gqlUrl, {
        data: {
          query: mutation,
          variables: { claimId: 'claim-review-accept', decision: 'ACCEPTED', reviewerNote: null },
        },
      });
      const json = (await res.json()) as { errors?: Array<{ extensions?: { code?: string } }> };
      expect(json.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED_REVIEWER');
    }

    await login(page);
    const token = await page.evaluate(() => localStorage.getItem('aletheia_auth_token'));
    expect(token).toBeTruthy();

    // CLAIM_NOT_FOUND
    {
      const res = await page.request.post(gqlUrl, {
        headers: { authorization: `Bearer ${token}` },
        data: {
          query: mutation,
          variables: { claimId: 'does-not-exist', decision: 'ACCEPTED', reviewerNote: null },
        },
      });
      const json = (await res.json()) as { errors?: Array<{ extensions?: { code?: string } }> };
      expect(json.errors?.[0]?.extensions?.code).toBe('CLAIM_NOT_FOUND');
    }

    // INVALID_LIFECYCLE_TRANSITION (DRAFT -> ACCEPTED is forbidden)
    {
      const res = await page.request.post(gqlUrl, {
        headers: { authorization: `Bearer ${token}` },
        data: {
          query: mutation,
          variables: { claimId: 'claim-review-draft', decision: 'ACCEPTED', reviewerNote: null },
        },
      });
      const json = (await res.json()) as { errors?: Array<{ extensions?: { code?: string } }> };
      expect(json.errors?.[0]?.extensions?.code).toBe('INVALID_LIFECYCLE_TRANSITION');
    }
  });

  test('accept persists across reload and enforces terminal state', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/claims/claim-review-accept');

    await expect(page.getByRole('heading', { name: 'Claim review' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Claim').first()).toBeVisible({ timeout: 20_000 });

    // Evidence must be explicit and rendered.
    await expect(page.getByTestId('evidence-item')).toHaveCount(1);
    await expect(page.getByTestId('evidence-snippet')).toBeVisible({ timeout: 20_000 });

    const accept = page.getByRole('button', { name: 'Accept claim' });
    const reject = page.getByRole('button', { name: 'Reject claim' });

    await expect(accept).toBeEnabled();
    await expect(reject).toBeEnabled();

    await accept.click();

    await expect(page.getByTestId('claim-state')).toHaveText(/accepted/i, { timeout: 20_000 });
    await expect(accept).toBeDisabled();
    await expect(reject).toBeDisabled();
    await expect(page.getByText('This claim can no longer be modified.')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('claim-state')).toHaveText(/accepted/i, { timeout: 20_000 });
    await expect(accept).toBeDisabled();
    await expect(reject).toBeDisabled();
    await expect(page.getByText('This claim can no longer be modified.')).toBeVisible();
  });

  test('reject persists across reload and enforces terminal state', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/claims/claim-review-reject');

    await expect(page.getByRole('heading', { name: 'Claim review' })).toBeVisible({ timeout: 20_000 });

    const accept = page.getByRole('button', { name: 'Accept claim' });
    const reject = page.getByRole('button', { name: 'Reject claim' });

    await expect(accept).toBeEnabled();
    await expect(reject).toBeEnabled();

    await reject.click();

    await expect(page.getByTestId('claim-state')).toHaveText(/rejected/i, { timeout: 20_000 });
    await expect(accept).toBeDisabled();
    await expect(reject).toBeDisabled();
    await expect(page.getByText('This claim can no longer be modified.')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('claim-state')).toHaveText(/rejected/i, { timeout: 20_000 });
    await expect(accept).toBeDisabled();
    await expect(reject).toBeDisabled();
    await expect(page.getByText('This claim can no longer be modified.')).toBeVisible();
  });
});

