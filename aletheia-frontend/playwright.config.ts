import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration
 * 
 * Playwright provides:
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Auto-waiting and retry logic
 * - Network interception
 * - Screenshot and video recording
 * - Parallel test execution
 * 
 * Best practices:
 * - Test user-visible behavior, not implementation details
 * - Use data-testid sparingly (prefer role/label/text queries)
 * - Keep tests independent and isolated
 * - Use page object models for complex flows
 */

export default defineConfig({
  testDir: './e2e',

  // WebKit (and mobile WebKit) can be slow to start on Windows under load.
  // Increase the per-test timeout to reduce flaky "browserContext.newPage" failures.
  timeout: 60 * 1000,
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  // Also reduce parallelism on Windows to avoid browser startup timeouts.
  workers: process.env.CI ? 1 : process.platform === 'win32' ? 4 : undefined,

  expect: {
    timeout: 15 * 1000,
  },
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['html'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    // Prefer IPv4 loopback to avoid occasional localhost/IPv6 (::1) resolution issues on Windows.
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:3030',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    // Use production server for Playwright stability on Windows.
    // (Dev server can occasionally crash/hang under Playwright load.)
    command: 'npm run build && npm run start',
    // IMPORTANT:
    // Playwright E2E tests in this repo use `page.route` GraphQL interception (see `e2e/helpers/msw-handlers.ts`).
    // Therefore we must NOT enable the browser MSW service worker here, otherwise it will intercept `/graphql`
    // before Playwright can, leading to unhandled-operation 500s and non-deterministic behavior.
    env: {
      ...process.env,
      NEXT_PUBLIC_MSW: 'disabled',
    },
    url: 'http://127.0.0.1:3030',
    // Do not reuse an existing dev server: it may have MSW enabled, which would intercept `/graphql`
    // before Playwright route interception and cause unhandled-operation failures.
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
