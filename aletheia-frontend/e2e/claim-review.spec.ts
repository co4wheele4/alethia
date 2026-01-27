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

test.describe('Claims: review (single-claim)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('renders claim + offset evidence and blocks adjudication without schema support', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/claims/claim-1');

    await expect(page.getByRole('heading', { name: 'Claim review' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Claim').first()).toBeVisible({ timeout: 20_000 });

    // Evidence must be explicit and rendered.
    await expect(page.getByTestId('evidence-item')).toHaveCount(1);
    await expect(page.getByText('Test Entity is mentioned in Getting Started.')).toBeVisible({ timeout: 20_000 });

    // No silent fallback: adjudication is disabled with an explicit contract reason.
    const accept = page.getByRole('button', { name: 'Accept claim' });
    await expect(accept).toBeDisabled();
    await expect(page.getByText(/does not expose claim review\/adjudication mutations/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});

