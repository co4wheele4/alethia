import { test, expect } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test.describe('ADR-032 HTML crawl ingestion UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('lists crawl runs and shows run detail with fetched URLs', async ({ page }) => {
    await login(page);
    await page.goto('/ingestion/html-crawl-runs');
    await expect(page.getByTestId('html-crawl-runs-list')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('https://example.com/seed')).toBeVisible();

    await page.getByRole('link', { name: 'https://example.com/seed' }).click();
    await expect(page.getByTestId('html-crawl-run-detail')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('html-crawl-url-table')).toContainText('https://example.com/seed');
    await expect(page.getByTestId('html-crawl-url-table')).toContainText('SUCCESS');
  });

  test('evidence viewer shows exact raw HTML text and forbids semantic hype wording', async ({ page }) => {
    await login(page);
    await page.goto('/evidence/html-ev-1');
    await expect(page.getByTestId('evidence-viewer-content')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('evidence-viewer-content')).toContainText('<html><body>Exact mock bytes</body></html>');

    const body = (await page.getByTestId('evidence-viewer').textContent()) ?? '';
    const lower = body.toLowerCase();
    expect(lower).not.toContain('relevant');
    expect(lower).not.toContain('recommended');
    expect(lower).not.toContain(' best ');
    expect(lower).not.toMatch(/\btop\b/);
  });
});
