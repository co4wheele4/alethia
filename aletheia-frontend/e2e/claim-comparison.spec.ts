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

test.describe('Claims: comparison (read-only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('open from claim drawer → shows multiple claims with evidence → no adjudication → reload preserves state', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });

    // Open claim detail drawer (base claim selection happens here).
    await page.getByText('Test Entity is mentioned in Getting Started.').click();
    await expect(page.getByLabel('Claim detail drawer')).toBeVisible({ timeout: 20_000 });

    // Navigate via the "Compare" affordance.
    await page.getByRole('link', { name: /^compare$/i }).click();
    await page.waitForURL(/\/claims\/compare\?base=/, { timeout: 20_000 });

    // Multiple claims should be visible (base + at least one related).
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Claim 2')).toBeVisible();

    // Evidence is rendered and offset-driven highlight marks exist.
    await expect(page.getByTestId('claim-evidence-snippet').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Source document:\s*Getting Started/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('mention-highlight-mention-1').first()).toBeVisible({ timeout: 20_000 });

    // No adjudication actions exist on the comparison surface.
    await expect(page.getByRole('button', { name: /accept claim/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /reject claim/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /review claim/i })).toHaveCount(0);

    // Reload preserves state via query param.
    const urlBefore = page.url();
    await page.reload();
    await expect(page.getByText('Claim comparison').first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Claim 2')).toBeVisible();
  });
});

