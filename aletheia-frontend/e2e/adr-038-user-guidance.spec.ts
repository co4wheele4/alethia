/**
 * ADR-038: User guidance — structural copy on primary surfaces; no ranking / semantic judgment language.
 * Enforcement: structural blocked states, side-by-side comparison, non-semantic search ordering.
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

/** High-signal positive drift (substring checks). Exclude bare “relevance” — it appears in legitimate negation copy. */
const ADR038_HIGH_SIGNAL_FORBIDDEN: RegExp[] = [
  /most relevant/i,
  /best match/i,
  /strong evidence/i,
  /weak evidence/i,
  /better supported/i,
  /more supported/i,
  /insufficient support/i,
  /weak case/i,
  /confidence score/i,
  /relevance sort/i,
  /priority sort/i,
  /support sort/i,
  /default top/i,
  /top result/i,
  /top results/i,
  /likely true/i,
  /likely false/i,
  /higher quality/i,
  /lower quality/i,
  /sort by relevance/i,
  /order by relevance/i,
  /ai recommends/i,
  /strongest evidence/i,
];

async function expectNoHighSignalDrift(page: Page, scope: ReturnType<Page['locator']>) {
  const text = await scope.innerText();
  for (const re of ADR038_HIGH_SIGNAL_FORBIDDEN) {
    expect.soft(text, `unexpected drift pattern: ${re}`).not.toMatch(re);
  }
}

test.describe('ADR-038: User guidance copy', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('claim review: structural framing and no semantic drift', async ({ page }) => {
    await login(page);
    await page.goto('/claims/claim-1');
    await expect(page.getByText(/statements in the system/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/not automatic facts/i)).toBeVisible();
    await expect(page.getByText(/ADR-038/i)).toBeVisible();

    const main = page.locator('body');
    await expectNoHighSignalDrift(page, main);
    await expect(page.getByText(/No evidence resolved; adjudication is blocked/i)).toHaveCount(0);
    await expect(page.getByText(/insufficient support/i)).toHaveCount(0);
  });

  test('claim comparison: side-by-side structural inspection; no conclusion or preference copy', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/claims/compare?base=claim-1&with=claim-2');
    await expect(page.getByText(/neutral, read-only/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/No conflict, agreement, ranking, or confidence is inferred/i)).toBeVisible();
    await expect(page.getByText(/ADR-010/i)).toBeVisible();
    await expect(page.getByText(/ADR-038/i)).toBeVisible();

    await expect(page.getByText('Base')).toBeVisible();
    await expect(page.getByText('Claim 2')).toBeVisible();

    await expect(page.getByTestId('claim-evidence-snippet').first()).toBeVisible({ timeout: 20_000 });

    await expectNoHighSignalDrift(page, page.locator('body'));
    await expect(page.getByText(/winner/i)).toHaveCount(0);
    await expect(page.getByText(/conclusion/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /accept claim/i })).toHaveCount(0);
  });

  test('evidence detail: linked material; no strength framing', async ({ page }) => {
    await login(page);
    await page.goto('/evidence/cev-1');
    await expect(page.getByText(/stored and rendered as recorded/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/does not assess correctness/i)).toBeVisible();
    await expect(page.getByText(/ADR-038/i)).toBeVisible();

    await expectNoHighSignalDrift(page, page.locator('body'));
    await expect(page.getByText(/strong evidence/i)).toHaveCount(0);
  });

  test('search: ordering is structural fields only; no relevance marketing', async ({ page }) => {
    await login(page);
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /search claims/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('claim-search-order')).toBeVisible();

    await expect(page.getByText(/created time \(oldest first\)/i)).toBeVisible();
    await page.getByLabel('claim-search-order').click();
    await expect(page.getByRole('option', { name: /id ascending/i })).toBeVisible();
    await page.keyboard.press('Escape');

    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText).not.toContain('relevance sort');
    expect(bodyText).not.toContain('priority sort');
    expect(bodyText).not.toContain('best match');

    await expectNoHighSignalDrift(page, page.locator('body'));
  });

  test('review queue: coordination-only language; no verdict or strength framing', async ({ page }) => {
    await login(page);
    await page.goto('/review-queue');
    await expect(page.getByRole('banner').getByText('Review queue')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Pending review' }).first()).toBeVisible();
    await expectNoHighSignalDrift(page, page.locator('body'));
  });

  test('claims list + dashboard: forbidden marketing phrases are absent', async ({ page }) => {
    await login(page);
    const bad = [/most relevant/i, /strongest evidence/i, /ai recommends/i, /confidence score/i];
    await page.goto('/claims');
    await expect(page.getByRole('list', { name: 'claims-list' })).toBeVisible({ timeout: 20_000 });
    for (const re of bad) {
      await expect(page.getByText(re)).toHaveCount(0);
    }
    await page.goto('/dashboard');
    for (const re of bad) {
      await expect(page.getByText(re)).toHaveCount(0);
    }
  });
});
