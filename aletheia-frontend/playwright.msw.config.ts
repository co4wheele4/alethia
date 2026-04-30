import { defineConfig, devices } from '@playwright/test';

/**
 * MSW smoke E2E config
 *
 * Runs the app with browser MSW enabled and asserts we don't hit unhandled MSW requests.
 * This catches "intercepted a request without a matching request handler" regressions.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*msw-smoke\.spec\.ts/,
  timeout: 90 * 1000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  expect: {
    timeout: 15 * 1000,
  },
  reporter: [['list'], ['html']],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3104',
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
  webServer: {
    // Aligned with playwright.config.ts: build once, then start (next-port + strict port).
    command: 'npm run build && npm run start',
    env: {
      ...process.env,
      PORT: '3104',
      NEXT_PORT_STRICT: '1',
      NEXT_PUBLIC_MSW: 'enabled',
    },
    url: 'http://127.0.0.1:3104',
    reuseExistingServer: false,
    timeout: 300 * 1000,
  },
});

