import { test, expect } from '@playwright/test';
import { setupGraphQLMocks } from '../../../e2e/helpers/msw-handlers';

test.describe('Claim Adjudication', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('review page loads with evidence and valid actions', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: /^login$/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    await page.goto('/claims/claim-1');

    await expect(page.getByTestId('claim-text')).toBeVisible();
    await expect(page.getByTestId('claim-state')).toHaveText(/draft/i);

    const evidenceItems = page.getByTestId('evidence-item');
    await expect(evidenceItems).toHaveCount(1);

    await expect(
      evidenceItems.first().getByTestId('evidence-document-title')
    ).toBeVisible();

    await expect(
      evidenceItems.first().getByTestId('evidence-snippet')
    ).toBeVisible();

    // From DRAFT, only "Mark reviewed" is valid; accept/reject must be disabled.
    await expect(page.getByRole('button', { name: 'Mark reviewed' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Accept claim' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Reject claim' })).toBeDisabled();
  });
});

