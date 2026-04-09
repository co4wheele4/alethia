import { test, expect, type Page } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function login(page: Page, email = 'test@example.com') {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

test.describe('Claims: review (single-claim)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Adjudication E2E runs only in Chromium');
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Real-backend runs must hit Nest + seeded DB; MSW would issue a mock JWT that 3050 rejects.
    if (process.env.PLAYWRIGHT_REAL_BACKEND === '1') {
      return;
    }
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('adjudicateClaim error codes are contract-stable', async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_REAL_BACKEND !== '1',
      'Requires real backend (PLAYWRIGHT_REAL_BACKEND=1)'
    );
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

    await login(page, 'alice@example.com');
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

    // ADR-023: evidence gate — legacy anchor without mention/relationship links
    {
      const res = await page.request.post(gqlUrl, {
        headers: { authorization: `Bearer ${token}` },
        data: {
          query: mutation,
          variables: {
            claimId: 'claim-adjudication-no-closure',
            decision: 'REVIEW',
            reviewerNote: null,
          },
        },
      });
      const json = (await res.json()) as { errors?: Array<{ extensions?: { code?: string } }> };
      expect(json.errors?.[0]?.extensions?.code).toBe('EVIDENCE_REQUIRED_FOR_ADJUDICATION');
    }

    // ADR-023: no updateClaim mutation in schema
    {
      const res = await page.request.post(gqlUrl, {
        headers: { authorization: `Bearer ${token}` },
        data: {
          query: `mutation { updateClaim(id: "x", status: ACCEPTED) { id } }`,
        },
      });
      const json = (await res.json()) as { errors?: Array<{ message?: string }> };
      expect(json.errors?.length).toBeTruthy();
      const msg = String(json.errors?.[0]?.message ?? '');
      expect(msg.toLowerCase()).toMatch(/cannot query field|unknown field|updateclaim/i);
    }

    // ADR-024: no updateEvidence mutation in schema
    {
      const res = await page.request.post(gqlUrl, {
        headers: { authorization: `Bearer ${token}` },
        data: {
          query: `mutation { updateEvidence(id: "x") { id } }`,
        },
      });
      const json = (await res.json()) as { errors?: Array<{ message?: string }> };
      expect(json.errors?.length).toBeTruthy();
      const msg = String(json.errors?.[0]?.message ?? '');
      expect(msg.toLowerCase()).toMatch(/cannot query field|unknown field|updateevidence/i);
    }
  });

  test('accept persists across reload and enforces terminal state', async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_REAL_BACKEND !== '1',
      'Requires real backend (adjudicateClaim mutation)'
    );
    test.setTimeout(60_000);
    await login(page, 'alice@example.com');

    await page.goto('/claims/claim-review-accept');

    // AppShell title uses Typography component="div" (not a heading role in the a11y tree).
    await expect(page.getByRole('banner').getByText('Claim review')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Claim').first()).toBeVisible({ timeout: 20_000 });

    // Evidence must be explicit and rendered.
    await expect(page.getByTestId('evidence-item')).toHaveCount(1);
    const evidenceSnippet = page.getByTestId('evidence-snippet');
    await expect(evidenceSnippet).toBeVisible({ timeout: 20_000 });
    // ADR-024: visible snippet is non-empty verbatim surface (no placeholder-only UI).
    const snippetText = (await evidenceSnippet.innerText()).trim();
    expect(snippetText.length).toBeGreaterThan(2);

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
    test.skip(
      process.env.PLAYWRIGHT_REAL_BACKEND !== '1',
      'Requires real backend (adjudicateClaim mutation)'
    );
    test.setTimeout(60_000);
    await login(page, 'alice@example.com');

    await page.goto('/claims/claim-review-reject');

    // AppShell title uses Typography component="div" (not a heading role in the a11y tree).
    await expect(page.getByRole('banner').getByText('Claim review')).toBeVisible({ timeout: 20_000 });

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

