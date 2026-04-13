import { test, expect, type Page } from '@playwright/test';

/** Dev-only noise when Playwright uses 127.0.0.1 and Next/webpack-hmr expect localhost (or similar). */
const DEMO_CONSOLE_ALLOW_PATTERNS: RegExp[] = [
  /webpack-hmr/i,
  /ERR_INVALID_HTTP_RESPONSE/i,
  /allowedDevOrigins/i,
  /Blocked cross-origin request/i,
];

function isAllowedDemoConsoleMessage(text: string): boolean {
  return DEMO_CONSOLE_ALLOW_PATTERNS.some((re) => re.test(text));
}

/**
 * Full product demo: real Nest + PostgreSQL (PLAYWRIGHT_REAL_BACKEND=1).
 * Mirrors docs/demo/feature-walkthrough.md — sign-in, ingestion (manual/file/url), workspace surfaces,
 * detail routes, and admin audit (optional second login).
 */
const AUTHOR = 'seed-author1@aletheia.test';
const ADMIN = 'seed-admin@aletheia.test';
const PASSWORD = 'password123';

const CLAIM_SHOWCASE = 'c0000004-0000-4000-8000-000000000004';
const CLAIM_DRAFT_WITH_EVIDENCE = 'c0000003-0000-4000-8000-000000000003';
const EVIDENCE_SHOWCASE = 'e0000001-0000-4000-8000-000000000001';
const ENTITY_POLICY = '30000001-0000-4000-8000-000000000001';

/** Live network: `/api/import-url` SSRF guard + server-side fetch (MSW does not intercept this path). */
const GOOGLE_NEWS_SEARCH_URL = 'https://www.google.com/search?q=news';

/** Headed demo: pause so viewers can follow each step (between pages and around Google import). */
const DEMO_DELAY_MS = 3_000;
/** Pause after each user interaction (clicks) so the tour is easy to follow. */
const DEMO_CLICK_DELAY_MS = 2_000;

async function pauseBetweenDemoPages(page: Page): Promise<void> {
  await page.waitForTimeout(DEMO_DELAY_MS);
}

async function demoClick(page: Page, action: () => Promise<void>): Promise<void> {
  await action();
  await page.waitForTimeout(DEMO_CLICK_DELAY_MS);
}

test.describe('Full demo walkthrough (real backend)', () => {
  test.skip(() => process.env.PLAYWRIGHT_REAL_BACKEND !== '1', 'Set PLAYWRIGHT_REAL_BACKEND=1 (npm run demo:headed)');

  test('ingestion + seeded workspace (headed)', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') consoleErrors.push(text);
      if (msg.type() === 'warning') consoleWarnings.push(text);
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(String(err));
    });

    await login(page, AUTHOR, PASSWORD);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Sources precede conclusions.')).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    await page.goto('/documents');
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Fetching document index').first()).toBeHidden({ timeout: 60_000 });
    await page.evaluate(() => {
      try {
        localStorage.setItem('aletheia.hasViewedDocuments.v1', 'true');
      } catch {
        /* ignore */
      }
    });
    // Match anywhere on the page — list subtree can be flaky with MUI ListItemText layout.
    await expect(page.getByText(/Access control policy excerpt/i).first()).toBeVisible({ timeout: 90_000 });
    await pauseBetweenDemoPages(page);
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
    await demoClick(page, () =>
      ingestDialog().getByRole('button', { name: /^ingest$/i }).click({ force: true }),
    );
    await expect(documentsList.getByText(manualTitle).first()).toBeVisible({ timeout: 45_000 });

    // --- File upload tab ---
    await openIngestDialog(page);
    dialog = ingestDialog();
    await demoClick(page, () => dialog.getByRole('tab', { name: /file upload/i }).click());
    const fileBase = `DemoFile${now}`;
    const fileName = `${fileBase}.txt`;
    await dialog.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(`File upload demo ${now}.\nSecond line.`, 'utf8'),
    });
    await expect(dialog.getByText(fileName)).toBeVisible();
    await confirmIrreversible(page);
    await demoClick(page, () =>
      ingestDialog().getByRole('button', { name: /ingest files/i }).click({ force: true }),
    );
    await expect(documentsList.getByText(fileBase).first()).toBeVisible({ timeout: 45_000 });

    // --- URL tab (example.com — stable for demos) ---
    await openIngestDialog(page);
    dialog = ingestDialog();
    await demoClick(page, () => dialog.getByRole('tab', { name: /url import/i }).click());
    await dialog.getByLabel('URL').fill('https://example.com/');
    await confirmIrreversible(page);
    await demoClick(page, () =>
      ingestDialog().getByRole('button', { name: /import & ingest/i }).click({ force: true }),
    );
    const urlDlg = ingestDialog();
    await urlDlg.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
      await demoClick(page, () =>
        urlDlg.locator('.MuiDialogActions-root').getByRole('button', { name: /^close$/i }).click(),
      );
    });

    // --- URL tab: optional live Google Search (skip in CI or when PLAYWRIGHT_SKIP_LIVE_GOOGLE=1) ---
    const skipLiveGoogle = process.env.CI === 'true' || process.env.PLAYWRIGHT_SKIP_LIVE_GOOGLE === '1';
    if (!skipLiveGoogle) {
      await openIngestDialog(page);
      dialog = ingestDialog();
      await demoClick(page, () => dialog.getByRole('tab', { name: /url import/i }).click());
      await dialog.getByLabel('URL').fill(GOOGLE_NEWS_SEARCH_URL);
      await confirmIrreversible(page);
      await page.waitForTimeout(DEMO_DELAY_MS);
      await demoClick(page, () =>
        ingestDialog().getByRole('button', { name: /import & ingest/i }).click({ force: true }),
      );
      await expect(ingestDialog()).toBeHidden({ timeout: 120_000 });
      await expect(documentsList.getByText(/Google Search|news – Google|news - Google/i).first()).toBeVisible({
        timeout: 45_000,
      });
      await page.waitForTimeout(DEMO_DELAY_MS);
    }

    await pauseBetweenDemoPages(page);

    // --- Onboarding wizard (first-run flow) ---
    await page.goto('/onboarding');
    await expect(page.getByText(/Truth requires evidence/i).first()).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    // Document detail — seeded doc (chunks / provenance)
    await page.goto('/documents/20000000-0000-4000-8000-000000000001');
    await expect(page.getByText(/Access control|chunk|provenance/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await pauseBetweenDemoPages(page);

    // Evidence by ID (verbatim + reproducibility surface)
    await page.goto(`/evidence/${EVIDENCE_SHOWCASE}`);
    await expect(page.getByRole('heading', { name: 'Evidence' })).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    // Entity detail (extracted entity + mentions)
    await page.goto(`/entities/${ENTITY_POLICY}`);
    await expect(page.getByText(/Policy AC-2024-03|MFA|CONTROL/i).first()).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    // Claims
    await page.goto('/claims');
    await expect(page.getByRole('heading', { name: 'Claims' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Production access is governed by policy/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await pauseBetweenDemoPages(page);

    // Draft claim with evidence (workspace contract)
    await page.goto(`/claims/${CLAIM_DRAFT_WITH_EVIDENCE}`);
    await expect(page.getByText(/Service X experienced downtime/i).first()).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    await page.goto(`/claims/${CLAIM_SHOWCASE}`);
    await expect(page.getByText(/Production access is governed by policy AC-2024-03/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await pauseBetweenDemoPages(page);

    await page.goto('/evidence');
    await expect(page.getByText('Document Evidence Viewer')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('list', { name: 'truth-documents' })).toBeVisible();
    await demoClick(page, () =>
      page
        .getByRole('list', { name: 'truth-documents' })
        .getByText(/Access control policy excerpt/i)
        .first()
        .click(),
    );
    await pauseBetweenDemoPages(page);

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search claims' })).toBeVisible({ timeout: 15_000 });
    const searchText = page.getByRole('textbox', { name: 'claim-search-text' });
    await searchText.fill('AC-2024-03');
    await expect(searchText).toHaveValue('AC-2024-03');
    await demoClick(page, () => page.getByRole('button', { name: /^search$/i }).click());
    await expect(page.getByRole('list', { name: 'claim-search-results' })).toContainText(/AC-2024-03/, {
      timeout: 25_000,
    });
    await pauseBetweenDemoPages(page);

    await page.goto('/entities');
    await expect(page.getByRole('heading', { name: /Entities \(extracted\)/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Policy AC-2024-03/i).first()).toBeVisible({ timeout: 15_000 });
    await pauseBetweenDemoPages(page);

    await page.goto('/relationships');
    await expect(page.getByRole('heading', { name: 'Relationships' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/requires/i).first()).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    await page.goto('/review-queue');
    await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    await page.goto(
      `/claims/compare?base=${CLAIM_SHOWCASE}&with=c0000005-0000-4000-8000-000000000005&with=c0000007-0000-4000-8000-000000000007`,
    );
    await expect(page.getByText(/Claim comparison/i).first()).toBeVisible({ timeout: 25_000 });
    await pauseBetweenDemoPages(page);

    // Provenance audit surface
    await page.goto('/provenance');
    await expect(page.getByText(/Documents/i).first()).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    // Analysis workspace (inspection; may list documents when seed + user docs exist)
    await page.goto('/analysis');
    await expect(page.getByText(/Analysis workspace/i).first()).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    // Questions workspace (gate cleared via localStorage above)
    await page.goto('/questions');
    await expect(page.getByText(/Scope \(explicit\)/i).first()).toBeVisible({ timeout: 20_000 });
    await pauseBetweenDemoPages(page);

    // HTML crawl runs (audit list; seed may have zero rows)
    await page.goto('/ingestion/html-crawl-runs');
    await expect(page.getByRole('heading', { name: 'HTML crawl ingestion runs' })).toBeVisible({
      timeout: 20_000,
    });
    await pauseBetweenDemoPages(page);

    await page.goto('/demo');
    await expect(page.getByText(/Feature demo walkthrough/i).first()).toBeVisible({ timeout: 15_000 });
    await pauseBetweenDemoPages(page);

    // Admin: epistemic audit stream (requires admin role)
    await openNavAndLogout(page);
    await login(page, ADMIN, PASSWORD);
    await page.goto('/admin/epistemic-events');
    await expect(page.getByText(/Epistemic events \(audit\)/i).first()).toBeVisible({ timeout: 25_000 });

    const unexpectedErrors = consoleErrors.filter((t) => !isAllowedDemoConsoleMessage(t));
    const unexpectedWarnings = consoleWarnings.filter((t) => !isAllowedDemoConsoleMessage(t));
    expect(
      unexpectedErrors,
      `Unexpected browser console errors:\n${unexpectedErrors.join('\n---\n')}`,
    ).toEqual([]);
    expect(
      unexpectedWarnings,
      `Unexpected browser console warnings:\n${unexpectedWarnings.join('\n---\n')}`,
    ).toEqual([]);
  });
});

async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 20_000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await demoClick(page, () => page.getByRole('button', { name: /^login$/i }).click());
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

async function openNavAndLogout(page: Page) {
  await demoClick(page, () => page.getByRole('button', { name: 'Open navigation' }).click());
  await demoClick(page, () => page.getByRole('menuitem', { name: /^logout$/i }).click());
  // `/demo` uses requireAuth={false}, so logout does not redirect — go to `/` for the login form.
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 20_000 });
}

async function openIngestDialog(page: Page) {
  await page.goto('/documents?ingest=1');
  await expect(page.getByRole('dialog', { name: 'Ingest documents' })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('ingest-irreversible-control')).toBeVisible({ timeout: 25_000 });
}

async function confirmIrreversible(page: Page) {
  await demoClick(page, () => page.getByTestId('ingest-irreversible-control').click({ force: true }));
}
