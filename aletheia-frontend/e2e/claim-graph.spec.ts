/**
 * ADR-021: Claim–Evidence Graph Integrity & Read-Only Topology
 *
 * Invariants enforced:
 * - Explicit edges only (Claim → Evidence)
 * - No claim→claim, no evidence→evidence edges
 * - No inferred relationships (shared evidence ≠ claim-to-claim edge)
 * - Node uniformity (no highlight/primary)
 * - No derived labels
 * - Navigation integrity
 * - No hidden computation (similarity, clustering, metrics APIs)
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

test.describe('ADR-021: Claim–Evidence Graph', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/graphql', setupGraphQLMocks);
  });

  test('Explicit Edge Only: every edge connects claim → evidence', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const edges = page.getByTestId('graph-edge');
    const count = await edges.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const claimNodes = page.getByTestId('graph-claim-node');
    const evidenceNodes = page.getByTestId('graph-evidence-node');
    await expect(claimNodes.first()).toBeVisible();
    await expect(evidenceNodes.first()).toBeVisible();
  });

  test('No Inferred Relationships: two claims sharing evidence produce only claim→evidence edges', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    // WebKit / Mobile Safari can paint the SVG edge layer after the heading; use auto-wait assertions.
    const edgeTimeout = 30_000;
    await expect(page.getByTestId('graph-edge')).toHaveCount(3, { timeout: edgeTimeout });
    await expect(page.getByTestId('graph-claim-node')).toHaveCount(3, { timeout: edgeTimeout });
    await expect(page.getByTestId('graph-evidence-node')).toHaveCount(2, { timeout: edgeTimeout });
  });

  test('Node Uniformity: all nodes rendered with same styling class', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const claimNodes = page.getByTestId('graph-claim-node');
    const evidenceNodes = page.getByTestId('graph-evidence-node');
    const total = (await claimNodes.count()) + (await evidenceNodes.count());
    expect(total).toBeGreaterThanOrEqual(1);

    const highlighted = page.locator('[class*="highlight"], [class*="primary"], [data-highlighted="true"]');
    expect(await highlighted.count()).toBe(0);
  });

  test('No Derived Labels: node labels contain only claim text or evidence identifier', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const forbiddenTerms = ['related claims', 'similar claims', 'cluster', 'strong evidence', 'weak evidence'];
    const bodyText = (await page.locator('body').textContent()) ?? '';
    for (const term of forbiddenTerms) {
      expect(bodyText.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  test('Navigation Integrity: claim node navigates to /claims/[id]', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const firstClaimNode = page.getByTestId('graph-claim-node').first();
    await firstClaimNode.click();
    await page.waitForURL(/\/claims\/claim-/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/claims\/claim-\d/);
  });

  test('Navigation Integrity: evidence node navigates to source', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const firstEvidenceNode = page.getByTestId('graph-evidence-node').first();
    await firstEvidenceNode.click();
    await page.waitForURL(/\/(documents|evidence)/, { timeout: 10_000 });
  });

  test('No Hidden Computation: no API calls for similarity, clustering, metrics', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const graphqlRequests: string[] = [];
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postData();
      if (postData) {
        try {
          const parsed = JSON.parse(postData) as { query?: string; operationName?: string };
          graphqlRequests.push(parsed.query ?? parsed.operationName ?? '(unknown)');
        } catch {
          graphqlRequests.push('(parse error)');
        }
      }
      await setupGraphQLMocks(route);
    });

    await login(page);
    await page.goto('/claims/graph');
    await expect(page.getByRole('heading', { name: /Claim–Evidence Graph/i })).toBeVisible({
      timeout: 20_000,
    });

    const forbiddenPatterns = [
      /similarity/i,
      /cluster/i,
      /centrality/i,
      /degree/i,
      /ranking/i,
      /influence/i,
      /relatedClaims/i,
    ];
    for (const req of graphqlRequests) {
      for (const pattern of forbiddenPatterns) {
        expect(req).not.toMatch(pattern);
      }
    }
  });
});
