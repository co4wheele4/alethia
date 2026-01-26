import { test, expect, type Page, type Route } from '@playwright/test';
import { setupGraphQLMocks } from './helpers/msw-handlers';

async function login(page: Page) {
  await page.goto('/');
  await page.waitForSelector('input[name="email"]', { timeout: 10_000 });
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

function withDelayedDocuments(routeHandler: (route: Route) => Promise<void>, delayMs = 900) {
  return async (route: Route) => {
    const body = await route.request().postData();
    const parsed: { operationName?: string; query?: string } = body ? JSON.parse(body) : {};
    const op =
      parsed.operationName ??
      (typeof parsed.query === 'string' ? parsed.query.match(/(?:query|mutation)\s+(\w+)/)?.[1] : undefined);

    // Delay common "documents list" operations so the UI renders a loading row deterministically.
    const shouldDelay =
      op === 'DocumentsByUser' || op === 'DocumentIndexByUser' || op === 'ListDocuments' || op === 'DocumentIndexByUser';

    if (shouldDelay) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    await routeHandler(route);
  };
}

test.describe('Global progress indicator', () => {
  test('renders a progressbar during loading states', async ({ page }) => {
    await page.route('**/graphql', withDelayedDocuments(setupGraphQLMocks, 1200));

    await login(page);
    await page.goto('/evidence');

    // Loading row should appear while GraphQL is delayed.
    await expect(page.getByText(/Loading documents…/i)).toBeVisible({ timeout: 10_000 });

    // Global progress indicator should be present (role + accessible name).
    const indicator = page.getByRole('progressbar', { name: /loading/i }).first();
    await expect(indicator).toBeVisible({ timeout: 10_000 });

    // After the delayed response, the list should render and loading row should disappear.
    const documentsList = page.getByRole('list', { name: 'truth-documents' });
    await expect(documentsList.getByText('Getting Started').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Loading documents…/i)).toHaveCount(0);
  });

  test('prefers-reduced-motion disables indicator animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/graphql', withDelayedDocuments(setupGraphQLMocks, 1200));

    await login(page);
    await page.goto('/evidence');

    // Ensure indicator exists.
    const drawLayer = page.locator('.aletheia-lady-justice-line-draw').first();
    await expect(drawLayer).toBeVisible({ timeout: 10_000 });

    // Reduced motion should disable animation via global CSS.
    const animationName = await drawLayer.evaluate((el) => getComputedStyle(el).animationName);
    expect(String(animationName).toLowerCase()).toMatch(/none|initial|unset/);
  });
});

