import { defineConfig, devices } from '@playwright/test';
import net from 'node:net';

function parsePort(value: string | undefined, fallback: number) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0 && n < 65_536) return n;
  return fallback;
}

function canBind(port: number, host: string) {
  return new Promise<{ ok: boolean; err: NodeJS.ErrnoException | null }>((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (err: NodeJS.ErrnoException) => resolve({ ok: false, err }));
    server.listen({ port, host }, () => {
      server.close(() => resolve({ ok: true, err: null }));
    });
  });
}

async function isPortFree(port: number) {
  const v4 = await canBind(port, '0.0.0.0');
  if (!v4.ok && v4.err && v4.err.code === 'EADDRINUSE') return false;

  const v6 = await canBind(port, '::');
  if (!v6.ok && v6.err && v6.err.code === 'EADDRINUSE') return false;

  if (!v6.ok && v6.err && (v6.err.code === 'EAFNOSUPPORT' || v6.err.code === 'EINVAL')) {
    return v4.ok;
  }

  return v4.ok && v6.ok;
}

async function firstFreePort(startPort: number, maxTries = 50) {
  for (let p = startPort, i = 0; i < maxTries; i += 1, p += 1) {
    const free = await isPortFree(p);
    if (free) return p;
  }
  throw new Error(
    `[playwright] No free port found in range [${startPort}, ${startPort + maxTries - 1}] (needed for Next + Playwright webServer health checks).`,
  );
}

async function resolveFrontendTarget() {
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
    const u = new URL(process.env.PLAYWRIGHT_TEST_BASE_URL);
    const port = parsePort(u.port, u.protocol === 'https:' ? 443 : 80);
    const free = await isPortFree(port);
    if (!free) {
      throw new Error(
        `[playwright] PLAYWRIGHT_TEST_BASE_URL uses port ${port}, but that port is not free. ` +
          `Free the port or point PLAYWRIGHT_TEST_BASE_URL at a free port (or unset it to auto-pick).`,
      );
    }
    u.port = String(port);
    return {
      baseURL: u.toString().replace(/\/$/, ''),
      port,
      // Keep GraphQL on the same origin the app is served from for these tests.
      graphqlUrl: new URL('/graphql', u).toString(),
    };
  }

  const fromEnv = process.env.PLAYWRIGHT_TEST_PORT
    ? parseInt(process.env.PLAYWRIGHT_TEST_PORT, 10)
    : NaN;
  const startPort = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3040;
  const port = await firstFreePort(startPort);
  const base = new URL(`http://127.0.0.1:${port}`);
  return {
    baseURL: base.toString().replace(/\/$/, ''),
    port,
    graphqlUrl: new URL('/graphql', base).toString(),
  };
}

/**
 * Full matrix (Chromium, Firefox, WebKit, mobile) runs in CI or when
 * `PLAYWRIGHT_ALL_BROWSERS=1` (after `npx playwright install`).
 * Default local runs use Chromium only so `npm test` / root test-all succeeds without
 * every browser binary (common on Windows when only Chromium was installed).
 */
const useFullBrowserMatrix =
  process.env.CI === 'true' || process.env.PLAYWRIGHT_ALL_BROWSERS === '1';

/**
 * In CI always start fresh servers.
 *
 * Locally, reusing an existing server is convenient, but it can also cause Playwright to "think"
 * the webServer is healthy while something else is bound to the expected port (especially on Windows),
 * leading to long waits until `webServer.timeout`.
 *
 * Default: reuse on POSIX only; on Windows, always start fresh unless explicitly overridden.
 */
const reuseExistingServer =
  process.env.CI === 'true'
    ? false
    : process.platform === 'win32'
      ? process.env.PLAYWRIGHT_REUSE_SERVER === '1'
      : true;

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

export default (async () => {
  const frontendTarget = await resolveFrontendTarget();
  return defineConfig({
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
    // Base URL for tests (port chosen to avoid conflict; see `webServer` below)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || frontendTarget.baseURL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  projects: useFullBrowserMatrix
    ? [
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
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
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
              // start:prod must use the same DATABASE_URL/JWT_SECRET as seed (`.env.test`), not only root `.env`.
              'npx dotenv-cli -e aletheia-backend/.env.test -- npm run --workspace=aletheia-backend start:prod',
            env: {
              ...process.env,
              PORT: '3050',
              // Browser origin for Playwright webServer (see backend main.ts CORS).
              ALLOWED_ORIGINS:
                process.env.ALLOWED_ORIGINS ??
                `http://127.0.0.1:${frontendTarget.port},http://localhost:${frontendTarget.port}`,
            },
            url: 'http://127.0.0.1:3050/graphql',
            reuseExistingServer,
            // migrate + seed + nest build + start can exceed 3m on cold machines / Windows.
            timeout: 420 * 1000,
          },
          {
            // Frontend (production server for stability)
            command: 'npm run build && npm run start',
            env: {
              ...process.env,
              PORT: String(frontendTarget.port),
              NEXT_PUBLIC_MSW: 'disabled',
              NEXT_PUBLIC_E2E_FIXTURES: 'disabled',
              NEXT_PUBLIC_GRAPHQL_URL: 'http://127.0.0.1:3050/graphql',
            },
            url: frontendTarget.baseURL,
            reuseExistingServer,
            // Windows can be very slow for cold `next build` + boot; keep below Playwright's default max.
            timeout: 45 * 60 * 1000,
          },
        ]
      : {
          // Frontend only (GraphQL requests are intercepted per-test via Playwright routing).
          command: 'npm run build && npm run start',
          env: {
            ...process.env,
            PORT: String(frontendTarget.port),
            NEXT_PUBLIC_MSW: 'disabled',
            NEXT_PUBLIC_E2E_FIXTURES: 'disabled',
            NEXT_PUBLIC_GRAPHQL_URL: frontendTarget.graphqlUrl,
          },
          url: frontendTarget.baseURL,
          reuseExistingServer,
          // `npm run build && npm run start` can exceed 3m on cold Windows machines.
          // Keep below Playwright's default max, but high enough for slow laptops/AV + cold caches.
          timeout: 45 * 60 * 1000,
        },
  });
})();
