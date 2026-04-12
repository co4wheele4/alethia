import { defineConfig, devices } from '@playwright/test';

/**
 * Headed demo walkthrough: expects dev servers already running (`npm run demo -- --headed --seed`).
 * No webServer — PLAYWRIGHT_TEST_BASE_URL must point at the Next.js app (3030+).
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['e2e/full-demo-walkthrough.spec.ts'],
  timeout: 240 * 1000,
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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
