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
  // Support both legacy `e2e/` and newer `tests/e2e/` specs.
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'tests/e2e/**/*.spec.ts'],

  // WebKit (and mobile WebKit) can be slow to start on Windows under load.
  // Increase the per-test timeout to reduce flaky "browserContext.newPage" failures.
  timeout: 90 * 1000,
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  // Also reduce parallelism on Windows to avoid browser startup timeouts.
  workers: process.env.CI ? 1 : process.platform === 'win32' ? 2 : undefined,

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

  /**
   * Web servers for E2E.
   *
   * Default: frontend only. Our E2E suite routes GraphQL requests in the browser and provides deterministic fixtures,
   * so a real backend is not required for most tests.
   *
   * Set `PLAYWRIGHT_REAL_BACKEND=1` to run against a real backend + seeded DB.
   */
  webServer:
    process.env.PLAYWRIGHT_REAL_BACKEND === '1'
      ? [
          {
            // Backend (real GraphQL)
            // - Uses `.env.test` (via dotenv-cli) to ensure Playwright hits a real DB.
            // - Seeds deterministic claims for adjudication tests.
            command:
              'cd .. && ' +
              'npm run --workspace=aletheia-backend test:e2e:setup && ' +
              'npm run --workspace=aletheia-backend test:e2e:seed && ' +
              'npm run --workspace=aletheia-backend build && ' +
              'npm run --workspace=aletheia-backend start:prod',
            env: {
              ...process.env,
              PORT: '3050',
            },
            url: 'http://127.0.0.1:3050/graphql',
            reuseExistingServer: false,
            timeout: 180 * 1000,
          },
          {
            // Frontend (production server for stability)
            command: 'npm run build && npm run start',
            env: {
              ...process.env,
              NEXT_PUBLIC_MSW: 'disabled',
              NEXT_PUBLIC_E2E_FIXTURES: 'disabled',
              NEXT_PUBLIC_GRAPHQL_URL: 'http://127.0.0.1:3050/graphql',
            },
            url: 'http://127.0.0.1:3030',
            reuseExistingServer: false,
            timeout: 180 * 1000,
          },
        ]
      : {
          // Frontend only (GraphQL requests are intercepted per-test via Playwright routing).
          command: 'npm run build && npm run start',
          env: {
            ...process.env,
            NEXT_PUBLIC_MSW: 'disabled',
            NEXT_PUBLIC_E2E_FIXTURES: 'disabled',
            NEXT_PUBLIC_GRAPHQL_URL: 'http://127.0.0.1:3030/graphql',
          },
          url: 'http://127.0.0.1:3030',
          reuseExistingServer: false,
          timeout: 180 * 1000,
        },
});
