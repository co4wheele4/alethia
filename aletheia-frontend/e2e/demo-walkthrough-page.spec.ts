import { test, expect } from '@playwright/test';

/**
 * Smoke: demo route renders walkthrough content (no GraphQL).
 */
test.describe('Demo walkthrough page', () => {
  test('shows repository walkthrough marker text', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByText(/Feature demo walkthrough|demo walkthrough/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/docs\/demo\/feature-walkthrough\.md/).first()).toBeVisible({ timeout: 15_000 });
  });
});
