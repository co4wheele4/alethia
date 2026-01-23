/**
 * Production smoke validation (no mocks):
 * - Register (or upgrade legacy account) to obtain JWT with sub
 * - Open /documents
 * - Open ingest dialog
 * - Ingest manual text
 * - Verify document appears
 * - Delete document
 * - Verify UI updates (document disappears)
 *
 * Usage (from aletheia-frontend):
 *   node scripts/validate-documents-ingestion.cjs
 *
 * Optional env:
 *   BASE_URL=http://127.0.0.1:3030
 */
const { chromium, expect } = require('@playwright/test');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ingestManualAndDelete(page, documentsList, now) {
  const docTitle = `Playwright Doc ${now}`;
  const docText = `Playwright ingested content ${now}.`;

  const openIngest = page.getByTestId('open-ingest-dialog');
  await expect(openIngest).toBeVisible({ timeout: 30_000 });
  await openIngest.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /ingest documents/i })).toBeVisible({ timeout: 30_000 });

  // Ensure we're on the manual tab (default)
  await dialog.getByLabel('Title').fill(docTitle);
  await dialog.getByLabel('Text').fill(docText);
  await dialog.getByLabel(/i understand ingestion is irreversible/i).check();
  await dialog.getByRole('button', { name: /^ingest$/i }).click();

  await expect(documentsList.getByText(docTitle).first()).toBeVisible({ timeout: 30_000 });
  await documentsList.locator(`button[aria-label="Delete ${docTitle}"]`).click();
  await expect(documentsList.getByText(docTitle)).toHaveCount(0, { timeout: 30_000 });
}

async function ingestFileAndDelete(page, documentsList, now) {
  const fileBase = `Playwright File ${now}`;
  const fileName = `${fileBase}.txt`;
  const fileContents = `Playwright file ingested content ${now}.\nSecond line.`;

  const openIngest = page.getByTestId('open-ingest-dialog');
  await expect(openIngest).toBeVisible({ timeout: 30_000 });
  await openIngest.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /ingest documents/i })).toBeVisible({ timeout: 30_000 });

  // Switch to file upload tab
  await dialog.getByRole('tab', { name: /file upload/i }).click();

  // Attach a .txt file (payload) to the hidden input inside the dialog
  const fileInput = dialog.locator('input[type="file"]');
  await expect(fileInput).toHaveCount(1, { timeout: 10_000 });
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: 'text/plain',
    buffer: Buffer.from(fileContents, 'utf8'),
  });

  // File row should appear
  await expect(dialog.getByText(fileName)).toBeVisible({ timeout: 10_000 });

  await dialog.getByLabel(/i understand ingestion is irreversible/i).check();
  await dialog.getByRole('button', { name: /ingest files/i }).click();

  // Title derived from filename (without extension)
  await expect(documentsList.getByText(fileBase).first()).toBeVisible({ timeout: 30_000 });
  await documentsList.locator(`button[aria-label="Delete ${fileBase}"]`).click();
  await expect(documentsList.getByText(fileBase)).toHaveCount(0, { timeout: 30_000 });
}

async function waitForHttpOk(url, timeoutMs) {
  const start = Date.now();
  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // keep polling
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${url} to respond OK`);
    }
    await sleep(500);
  }
}

async function maybeClick(page, locator) {
  if (await locator.count()) {
    await locator.first().click();
    return true;
  }
  return false;
}

async function waitForUrlOrError(page, urlRegex, timeoutMs) {
  const start = Date.now();
  while (true) {
    const current = page.url();
    if (urlRegex.test(current)) return;

    // If the page shows an explicit error alert with text, fail fast with that message.
    try {
      const alerts = page.getByRole('alert');
      const count = await alerts.count();
      for (let i = 0; i < Math.min(count, 5); i += 1) {
        const a = alerts.nth(i);
        if (!(await a.isVisible())) continue;
        const msg = (await a.innerText()).trim();
        if (msg.length > 0) {
          throw new Error(`Auth did not complete. UI error: ${msg}`);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Auth did not complete.')) throw e;
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for URL ${String(urlRegex)}. Current URL: ${current}`);
    }
    await sleep(250);
  }
}

async function main() {
  // Use localhost by default to match backend CORS allowlist in `aletheia-backend/src/main.ts`.
  const baseURL = process.env.BASE_URL || 'http://localhost:3030';
  await waitForHttpOk(`${baseURL}/`, 120_000);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log GraphQL errors to pinpoint real-backend failures.
  page.on('request', (req) => {
    const url = req.url();
    if (!url.includes('/graphql')) return;
    try {
      const method = req.method();
      let operationName = '(unknown)';
      if (method === 'POST') {
        const post = req.postData();
        if (post) {
          const parsed = JSON.parse(post);
          operationName = parsed.operationName || '(missing)';
        }
      } else if (method === 'GET') {
        const u = new URL(url);
        operationName = u.searchParams.get('operationName') || '(missing)';
      }
      console.log(`[graphql->] ${operationName} ${method} ${url}`);
    } catch {
      console.log(`[graphql->] ${req.method()} ${url}`);
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('/graphql')) return;
    const failure = req.failure();
    console.log(`[graphql!!] request failed ${req.method()} ${url} ${failure ? failure.errorText : ''}`);
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/graphql')) return;
    try {
      const req = res.request();
      const method = req.method();
      let operationName = '(unknown)';
      if (method === 'POST') {
        const post = req.postData();
        if (post) {
          const parsed = JSON.parse(post);
          operationName = parsed.operationName || '(missing)';
        }
      } else if (method === 'GET') {
        const u = new URL(url);
        operationName = u.searchParams.get('operationName') || '(missing)';
      }

      const json = await res.json().catch(() => null);
      if (!json) {
        console.log(`[graphql<-] ${operationName} status=${res.status()} (non-JSON response)`);
      }
      if (json && typeof json === 'object' && Array.isArray(json.errors) && json.errors.length > 0) {
        const msgs = json.errors
          .map((e) => (e && typeof e === 'object' && typeof e.message === 'string' ? e.message : String(e)))
          .join(' | ');
        console.log(`[graphql] ${operationName} status=${res.status()} errors=${msgs}`);
      }
    } catch (e) {
      console.log(`[graphql] (error reading response) ${String(e)}`);
    }
  });

  const now = Date.now();
  const email = `pw-smoke-${now}@example.com`;
  const password = 'Password123!';

  // Register (preferred). If a legacy account exists, register will set a password.
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="email"]', { timeout: 20_000 });

  // Switch to register mode if available.
  await maybeClick(page, page.getByRole('tab', { name: /^register$/i }));

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  const nameInput = page.locator('input[name="name"]');
  if (await nameInput.count()) {
    await nameInput.fill('Playwright Smoke User');
  }

  const submitted =
    (await maybeClick(page, page.getByRole('button', { name: /^register$/i }))) ||
    (await maybeClick(page, page.getByRole('button', { name: /create account|sign up/i })));
  if (!submitted) {
    throw new Error('Could not find a Register/Sign up submission control on the auth page.');
  }

  await waitForUrlOrError(page, /\/dashboard/, 30_000);

  // Documents
  await page.goto(`${baseURL}/documents`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Documents').first()).toBeVisible({ timeout: 30_000 });

  const documentsList = page.getByRole('list', { name: 'documents-list' });
  await expect(documentsList).toBeVisible({ timeout: 30_000 });

  // Manual text ingestion validation
  await ingestManualAndDelete(page, documentsList, now);

  // File ingestion validation (txt)
  await ingestFileAndDelete(page, documentsList, now);

  await browser.close();
  console.log('✅ Production ingestion flow validated successfully (manual + file).');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

