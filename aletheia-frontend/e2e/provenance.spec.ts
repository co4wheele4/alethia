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

test.describe('Provenance (extra coverage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('should render provenance inspector with parsed chunk-0 header', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/provenance');
    await expect(page.getByRole('heading', { name: 'Provenance' })).toBeVisible({ timeout: 10_000 });

    const docs = page.getByRole('list', { name: 'provenance-documents' });
    await expect(docs).toBeVisible();
    await expect(docs.getByText('Getting Started').first()).toBeVisible({ timeout: 10_000 });

    // Inspector should parse URL provenance from chunk 0.
    await expect(page.getByRole('heading', { name: 'Provenance' }).first()).toBeVisible();
    await expect(page.getByText('Ingestion header (immutable)')).toBeVisible();
    await expect(page.getByText('Getting Started').first()).toBeVisible();
    await expect(page.getByText('https://example.com/getting-started', { exact: true })).toBeVisible();

    // Raw header toggle should work.
    await page.getByRole('button', { name: /show raw header/i }).click();
    await expect(page.locator('pre').getByText(/kind:\s*url/i).first()).toBeVisible();
  });
});

