import { defineConfig, devices } from '@playwright/test';

/**
 * Headed demo walkthrough: expects dev servers already running (`npm run demo -- --headed --seed`).
 * No webServer — PLAYWRIGHT_TEST_BASE_URL must point at the Next.js app (3030+).
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/full-demo-walkthrough.spec.ts'],
  // Full walkthrough + 3s pauses between pages (see full-demo-walkthrough.spec.ts).
  timeout: 15 * 60 * 1000,
  expect: { timeout: 20 * 1000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Full window height (and width): fixed Desktop Chrome viewport is 1280×720.
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
    },
  ],
});
