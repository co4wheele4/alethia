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

async function clickDeleteForTitle(page: Page, title: string) {
  const documentsList = page.getByRole('list', { name: 'documents-list' });
  const deleteBtn = documentsList.locator(`button[aria-label="Delete ${title}"]`);
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 500) {
    await deleteBtn.click({ force: true });
  } else {
    await deleteBtn.click();
  }
}

async function clickOpenIngest(page: Page) {
  const openBtn = page.getByTestId('open-ingest-dialog');
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 500) {
    await openBtn.click({ force: true });
  } else {
    await openBtn.click();
  }
}

test.describe('Documents (extra coverage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('should ingest a document from file upload and delete it', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10_000 });

    const documentsList = page.getByRole('list', { name: 'documents-list' });
    await expect(documentsList.getByText('Getting Started').first()).toBeVisible({ timeout: 10_000 });

    await clickOpenIngest(page);
    await expect(page.getByRole('heading', { name: 'Ingest documents' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('tab', { name: /file upload/i }).click();

    const dialog = page.getByRole('dialog', { name: 'Ingest documents' });
    const fileInput = dialog.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'playwright-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello from Playwright file upload.\nThis should ingest.'),
    });
    await expect(dialog.getByText('playwright-upload.txt')).toBeVisible();

    const irreversible = dialog.getByLabel('Confirm irreversible ingestion');
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 500) {
      await irreversible.check({ force: true });
    } else {
      await irreversible.check();
    }
    const ingestFilesBtn = dialog.getByRole('button', { name: /ingest files/i });
    if (viewport && viewport.width < 500) {
      await ingestFilesBtn.click({ force: true });
    } else {
      await ingestFilesBtn.click();
    }

    // `parseFileToText` uses the filename without extension as the document title.
    const uploadedTitle = 'playwright-upload';
    await expect(documentsList.getByText(uploadedTitle).first()).toBeVisible({ timeout: 10_000 });

    await clickDeleteForTitle(page, uploadedTitle);
    await expect(documentsList.getByText(uploadedTitle)).toHaveCount(0);
  });

  test('should filter the documents list by title', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 10_000 });

    const documentsList = page.getByRole('list', { name: 'documents-list' });
    await expect(documentsList.getByText('Getting Started').first()).toBeVisible({ timeout: 10_000 });

    // Create a second document so filtering can exclude/include deterministically.
    await clickOpenIngest(page);
    const dialog = page.getByRole('dialog', { name: 'Ingest documents' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Title').fill('Filter Target');
    await dialog.getByLabel('Text').fill('Content for filter test.');
    const irreversible = dialog.getByLabel('Confirm irreversible ingestion');
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 500) {
      await irreversible.check({ force: true });
    } else {
      await irreversible.check();
    }
    const ingestBtn = dialog.getByRole('button', { name: /^ingest$/i });
    if (viewport && viewport.width < 500) {
      await ingestBtn.click({ force: true });
    } else {
      await ingestBtn.click();
    }

    await expect(documentsList.getByText('Filter Target').first()).toBeVisible({ timeout: 10_000 });

    // Filter to the seeded doc only.
    const filterInput = page.getByRole('textbox', { name: 'Filter' }).first();
    await filterInput.fill('Getting');
    await expect(documentsList.getByText('Getting Started').first()).toBeVisible();
    await expect(documentsList.getByText('Filter Target')).toHaveCount(0);

    // Filter to the ingested doc only.
    await filterInput.fill('Filter');
    await expect(documentsList.getByText('Filter Target').first()).toBeVisible();
    await expect(documentsList.getByText('Getting Started')).toHaveCount(0);

    // Cleanup
    await filterInput.fill('');
    await clickDeleteForTitle(page, 'Filter Target');
    await expect(documentsList.getByText('Filter Target')).toHaveCount(0);
  });
});

