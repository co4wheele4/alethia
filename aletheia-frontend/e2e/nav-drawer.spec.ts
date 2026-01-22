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

test.describe('Primary navigation drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('hamburger toggles drawer open/close (drawer should not block hamburger)', async ({ page }) => {
    await login(page);

    // Prefer attribute selector here because MUI's Modal can temporarily hide siblings
    // from the accessibility tree while the drawer is open.
    const hamburger = page.locator('button[aria-label="Open navigation"]');
    const nav = page.getByRole('navigation', { name: /primary navigation/i });

    // Open
    await hamburger.click();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Close by clicking hamburger again (this fails if the open drawer/backdrop blocks clicks)
    await hamburger.click();
    await expect(nav).toBeHidden({ timeout: 10000 });
  });
});

