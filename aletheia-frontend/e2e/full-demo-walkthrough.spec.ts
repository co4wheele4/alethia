import { test, expect, type Page } from '@playwright/test';

/**
 * Full product demo: real Nest + PostgreSQL (PLAYWRIGHT_REAL_BACKEND=1).
 * Mirrors docs/demo/feature-walkthrough.md — sign-in, ingestion (manual/file/url), then workspace surfaces.
 */
const AUTHOR = 'seed-author1@aletheia.test';
const PASSWORD = 'password123';

const CLAIM_SHOWCASE = 'c0000004-0000-4000-8000-000000000004';

test.describe('Full demo walkthrough (real backend)', () => {
  test.skip(() => process.env.PLAYWRIGHT_REAL_BACKEND !== '1', 'Set PLAYWRIGHT_REAL_BACKEND=1 (npm run demo:headed)');

  test('ingestion + seeded workspace (headed)', async ({ page }) => {
    test.setTimeout(240_000);

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(String(err));
    });

    await login(page, AUTHOR, PASSWORD);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Sources precede conclusions.')).toBeVisible({ timeout: 20_000 });

    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Fetching document index').first()).toBeHidden({ timeout: 60_000 });
    // Match anywhere on the page — list subtree can be flaky with MUI ListItemText layout.
    await expect(page.getByText(/Access control policy excerpt/i).first()).toBeVisible({ timeout: 90_000 });
    const documentsList = page.getByRole('list', { name: 'documents-list' });

    const now = Date.now();

    const ingestDialog = () => page.getByRole('dialog', { name: 'Ingest documents' });

    // --- Manual ingestion ---
    await openIngestDialog(page);
    let dialog = ingestDialog();
    await expect(dialog).toBeVisible({ timeout: 25_000 });
    const manualTitle = `Demo manual ${now}`;
    const manualText = 'Auditable snapshot line one.\nAuditable snapshot line two.';
    // Title first, then body with force — filling the multiline field can remount after title changes.
    await dialog.getByTestId('ingest-manual-title').fill(manualTitle);
    await dialog.getByTestId('ingest-manual-text').fill(manualText, { force: true });
    await confirmIrreversible(page);
    // Re-resolve dialog + force click: enabling ingest can re-render and detach the button mid-action.
    await ingestDialog().getByRole('button', { name: /^ingest$/i }).click({ force: true });
    await expect(documentsList.getByText(manualTitle).first()).toBeVisible({ timeout: 45_000 });

    // --- File upload tab ---
    await openIngestDialog(page);
    dialog = ingestDialog();
    await dialog.getByRole('tab', { name: /file upload/i }).click();
    const fileBase = `DemoFile${now}`;
    const fileName = `${fileBase}.txt`;
    await dialog.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(`File upload demo ${now}.\nSecond line.`, 'utf8'),
    });
    await expect(dialog.getByText(fileName)).toBeVisible();
    await confirmIrreversible(page);
    await ingestDialog().getByRole('button', { name: /ingest files/i }).click({ force: true });
    await expect(documentsList.getByText(fileBase).first()).toBeVisible({ timeout: 45_000 });

    // --- URL tab (server-side fetch via /api/import-url; example.com is stable for demos) ---
    await openIngestDialog(page);
    dialog = ingestDialog();
    await dialog.getByRole('tab', { name: /url import/i }).click();
    await dialog.getByLabel('URL').fill('https://example.com/');
    await confirmIrreversible(page);
    await ingestDialog().getByRole('button', { name: /import & ingest/i }).click({ force: true });
    const urlDlg = ingestDialog();
    await urlDlg.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
      await urlDlg.locator('.MuiDialogActions-root').getByRole('button', { name: /^close$/i }).click();
    });

    // Document detail — seeded doc (chunks / provenance)
    await page.goto('/documents/20000000-0000-4000-8000-000000000001');
    await expect(page.getByText(/Access control|chunk|provenance/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Claims
    await page.goto('/claims');
    await expect(page.getByRole('heading', { name: 'Claims' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Production access is governed by policy/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`/claims/${CLAIM_SHOWCASE}`);
    await expect(page.getByText(/Production access is governed by policy AC-2024-03/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/evidence');
    await expect(page.getByText('Document Evidence Viewer')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('list', { name: 'truth-documents' })).toBeVisible();
    await page
      .getByRole('list', { name: 'truth-documents' })
      .getByText(/Access control policy excerpt/i)
      .first()
      .click();

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search claims' })).toBeVisible({ timeout: 15_000 });
    const searchText = page.getByRole('textbox', { name: 'claim-search-text' });
    await searchText.fill('AC-2024-03');
    await expect(searchText).toHaveValue('AC-2024-03');
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page.getByRole('list', { name: 'claim-search-results' })).toContainText(/AC-2024-03/, {
      timeout: 25_000,
    });

    await page.goto('/entities');
    await expect(page.getByRole('heading', { name: /Entities \(extracted\)/i })).toBeVisible({ timeout: 20_000 });

    await page.goto('/relationships');
    await expect(page.getByRole('heading', { name: 'Relationships' })).toBeVisible({ timeout: 20_000 });

    await page.goto('/review-queue');
    await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 25_000 });

    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({ timeout: 20_000 });

    await page.goto(
      `/claims/compare?base=${CLAIM_SHOWCASE}&with=c0000005-0000-4000-8000-000000000005&with=c0000007-0000-4000-8000-000000000007`,
    );
    await expect(page.getByText(/Claim comparison/i).first()).toBeVisible({ timeout: 25_000 });

    await page.goto('/demo');
    await expect(page.getByText(/Feature demo walkthrough/i).first()).toBeVisible({ timeout: 15_000 });

    if (consoleErrors.length > 0) {
      console.warn('[demo] Browser console errors (first 12):', consoleErrors.slice(0, 12));
    }
  });
});

async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 20_000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

async function openIngestDialog(page: Page) {
  await page.goto('/documents?ingest=1');
  await expect(page.getByRole('dialog', { name: 'Ingest documents' })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('ingest-irreversible-control')).toBeVisible({ timeout: 25_000 });
}

async function confirmIrreversible(page: Page) {
  await page.getByTestId('ingest-irreversible-control').click({ force: true });
}
