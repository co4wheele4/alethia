/**
 * ADR-038: User guidance — structural copy on primary surfaces; no ranking / semantic judgment language.
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

test.describe('ADR-038: User guidance copy', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('claim review surfaces structural claim/evidence framing', async ({ page }) => {
    await login(page);
    await page.goto('/claims/claim-1');
    await expect(page.getByText(/statements in the system/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/not automatic facts/i)).toBeVisible();
    await expect(page.getByText(/ADR-038/i)).toBeVisible();
  });

  test('claim comparison stays non-judgmental (structural)', async ({ page }) => {
    await login(page);
    await page.goto('/claims/compare?base=claim-1&with=claim-2');
    await expect(page.getByText(/neutral, read-only/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/No conflict, agreement, ranking, or confidence is inferred/i)).toBeVisible();
  });

  test('evidence detail explains verbatim storage (no quality judgment)', async ({ page }) => {
    await login(page);
    await page.goto('/evidence/cev-1');
    await expect(page.getByText(/stored and rendered as recorded/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/does not assess correctness/i)).toBeVisible();
  });

  test('forbidden marketing / ranking phrases are absent on claims + dashboard', async ({ page }) => {
    await login(page);
    const bad = [/most relevant/i, /strongest evidence/i, /ai recommends/i, /confidence score/i];
    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });
    for (const re of bad) {
      await expect(page.getByText(re)).toHaveCount(0);
    }
    await page.goto('/dashboard');
    for (const re of bad) {
      await expect(page.getByText(re)).toHaveCount(0);
    }
  });
});
