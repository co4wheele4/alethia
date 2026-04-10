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

/**
 * ADR-033: Search UI must not introduce relevance / ranking language.
 */
test.describe('ADR-033 search page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('search page renders controls and body has no forbidden relevance copy', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /search claims/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel('claim-search-text')).toBeVisible();
    await expect(page.getByLabel('claim-search-match-mode')).toBeVisible();
    await expect(page.getByLabel('claim-search-order')).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    const lower = bodyText.toLowerCase();
    expect(lower).not.toContain('relevance');
    expect(lower).not.toContain('best match');
    expect(lower).not.toContain('recommended');
  });
});
