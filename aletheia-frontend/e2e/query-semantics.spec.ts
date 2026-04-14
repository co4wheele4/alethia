/**
 * ADR-022: Query Non-Semantic Constraint — E2E guards
 *
 * Asserts:
 * 1. No sorting UI (no sort controls)
 * 2. No ranking language (Top, Best, Trending, Most supported)
 * 3. Claims in REVIEW have evidence
 */
import { test, expect, type Page } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function login(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

test.describe('ADR-022: Query semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('No sorting UI: no sort controls on claims or documents', async ({ page }) => {
    await login(page);

    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });
    expect(page.locator('[data-testid="sort"]')).toHaveCount(0);

    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: /documents|library/i })).toBeVisible({ timeout: 20_000 });
    expect(page.locator('[data-testid="sort"]')).toHaveCount(0);
  });

  test('No ranking language: no Top, Best, Trending, Most supported', async ({ page }) => {
    await login(page);

    const rankingTerms = ['Top', 'Best', 'Trending', 'Most supported'];
    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });

    for (const term of rankingTerms) {
      await expect(page.getByText(new RegExp(term, 'i'))).toHaveCount(0);
    }

    await page.goto('/dashboard');
    for (const term of rankingTerms) {
      await expect(page.getByText(new RegExp(term, 'i'))).toHaveCount(0);
    }
  });

  test('Claims in REVIEW have evidence', async ({ page }) => {
    await login(page);

    const json = await page.evaluate(async () => {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'ListClaims',
          query:
            'query ListClaims { claims(limit: 50, offset: 0) { id status evidence { id } } }',
        }),
      });
      return res.json();
    });

    const data = json as {
      data?: { claims?: Array<{ id: string; status: string; evidence: unknown[] }> };
      errors?: unknown[];
    };
    expect(data.errors).toBeUndefined();
    const claims = data.data?.claims ?? [];
    const inReview = claims.filter((c) => c.status === 'REVIEWED' || c.status === 'REVIEW');
    for (const claim of inReview) {
      expect(Array.isArray(claim.evidence)).toBe(true);
      expect(claim.evidence.length).toBeGreaterThan(0);
    }
  });
});
