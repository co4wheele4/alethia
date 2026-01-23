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

  test('truth surface: select document → select entity → exact offset highlight + provenance', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/evidence');
    await expect(page.getByText('Document Evidence Viewer')).toBeVisible({ timeout: 20000 });

    // Document list should be visible and populated from mocks.
    await expect(page.getByRole('list', { name: 'truth-documents' })).toBeVisible();
    await expect(page.getByText(/Getting Started/i).first()).toBeVisible({ timeout: 20000 });

    // Entity list is derived from explicit mentions in the selected document (via GetDocumentEvidenceView).
    await expect(page.getByRole('list', { name: 'truth-entities' })).toBeVisible();
    await expect(page.getByText(/Test Entity/i).first()).toBeVisible({ timeout: 20000 });

    // Select the entity and verify evidence panel opens with explicit linkage + provenance.
    await page.getByText(/Test Entity/i).first().click();

    await expect(page.getByTestId('truth-provenance')).toContainText('Getting Started');
    await expect(page.getByTestId('truth-provenance')).toContainText('sourceType=URL');

    // Evidence must be explicit: chunk + offsets.
    await expect(page.getByText(/Chunk 1 • offsets 20–31/i)).toBeVisible();
    await expect(page.getByText(/chunkId=chunk-doc-1-1/i)).toBeVisible();

    // Highlight must match offsets exactly (no inferred snippet).
    const mark = page.getByTestId('mention-highlight-mention-1');
    await expect(mark).toBeVisible();
    await expect(mark).toHaveText('Test Entity');
  });
});

