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

test.describe('Claims: comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('select two claims → open comparison → evidence highlights render', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });

    // Select two claims for comparison (neutral, user-initiated).
    await page.getByRole('checkbox', { name: 'Select claim claim-1 for comparison' }).check();
    await page.getByRole('checkbox', { name: 'Select claim claim-2 for comparison' }).check();

    // Open comparison view.
    const open = page.getByRole('button', { name: 'Open claim comparison' });
    await expect(open).toBeEnabled();
    await open.click();

    await page.waitForURL(/\/claims\/compare/, { timeout: 20_000 });
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });

    // Evidence is grouped by document and mention offsets render via highlight marks.
    await expect(page.getByText(/Source document:\s*Getting Started/i).first()).toBeVisible({ timeout: 20_000 });
    const mark = page.getByTestId('mention-highlight-mention-1').first();
    await expect(mark).toBeVisible({ timeout: 20_000 });
    await expect(mark).toHaveText('Test Entity');
  });
});

