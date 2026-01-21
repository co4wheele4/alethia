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

test.describe('Evidence', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('renders evidence explorer after login', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/evidence');
    await expect(page.getByText('Evidence Explorer')).toBeVisible({ timeout: 20000 });

    // Ensure lists are loaded and visible
    await expect(page.getByText(/Document Index/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Entity List/i)).toBeVisible({ timeout: 15000 });

    // Documents and entities should be populated from mocks
    await expect(page.getByText(/Getting Started/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Test Entity/i).first()).toBeVisible({ timeout: 20000 });

    // The lists themselves should be visible
    await expect(page.getByRole('list', { name: 'explorer-documents' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'explorer-entities' })).toBeVisible();
  });
});

