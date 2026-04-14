/**
 * ADR-025: Agent Role Restrictions — UI must not present agent authority as recommendations or verdicts.
 */
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

test.describe('ADR-025: Agent role (no authoritative recommendations)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('No agent recommendation or verdict copy on primary surfaces', async ({ page }) => {
    await login(page);

    const phrases = [
      'agent recommendation',
      'AI recommendation',
      'AI recommends',
      'recommended verdict',
      'likely true',
      'strongest evidence',
      'weakest evidence',
    ];

    for (const route of ['/claims', '/dashboard', '/documents']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});

      for (const phrase of phrases) {
        await expect(page.getByText(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))).toHaveCount(0);
      }
    }
  });
});
