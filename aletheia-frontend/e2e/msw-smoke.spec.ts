import { test, expect, type Page } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

function attachMswErrorCollector(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    // Capture only warnings/errors to avoid noisy logs.
    if (msg.type() !== 'warning' && msg.type() !== 'error') return;
    const text = msg.text();
    if (!text) return;

    // Fail on MSW unhandled request messages specifically.
    if (text.includes('[MSW]') && text.toLowerCase().includes('matching request handler')) {
      errors.push(text);
    }
    if (text.includes('[MSW]') && text.toLowerCase().includes('unhandled request')) {
      errors.push(text);
    }
  });

  page.on('pageerror', (err) => {
    const text = String(err?.message ?? err);
    // MSWProvider throws on unhandled requests; surface that too.
    if (text.includes('[MSW]')) {
      errors.push(text);
    }
  });

  return errors;
}

async function login(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

test.describe('MSW smoke (dev-like)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('no unhandled MSW requests across core pages', async ({ page }) => {
    const mswErrors = attachMswErrorCollector(page);

    await login(page);

    // Visit a few core routes that exercise common GraphQL operations.
    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 20_000 });

    await page.goto('/entities');
    await expect(page.getByRole('heading', { name: 'Entities' })).toBeVisible({ timeout: 20_000 });

    // Entity detail route exercises `Entity(id)` and relationship evidence wiring.
    await page.goto('/entities/e_1');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Aletheia', exact: true })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/evidence');
    await expect(page.getByRole('heading', { name: /document evidence viewer/i })).toBeVisible({ timeout: 20_000 });

    // Provenance view exercises `Document(id)` lookups via header/chunk containers.
    await page.goto('/provenance');
    await expect(page.getByRole('heading', { name: 'Provenance' })).toBeVisible({ timeout: 20_000 });

    // Assert at end so we capture all MSW errors across pages.
    expect(mswErrors, mswErrors.join('\n\n')).toEqual([]);
  });
});

