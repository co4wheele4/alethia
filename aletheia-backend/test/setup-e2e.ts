// test/setup-e2e.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'node:child_process';

type E2EGlobal = typeof globalThis & {
  __ALETHEIA_E2E_DB_PREPARED__?: boolean;
};

const e2eGlobal = globalThis as E2EGlobal;

// Load .env.test if it exists, otherwise load .env but override with test database
const envTestPath = resolve(process.cwd(), '.env.test');
try {
  // Try to load .env.test first
  config({ path: envTestPath });
} catch {
  // If .env.test doesn't exist, load .env but we'll override DATABASE_URL below
  config();
}

// Always use test database for e2e tests
// Priority: TEST_DATABASE_URL env var > override existing URL to use aletheia_test > default test URL
if (process.env.TEST_DATABASE_URL) {
  // Prefer explicitly-provided test DB URL (e.g. in CI).
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  const existingUrl = process.env.DATABASE_URL || '';

  // If DATABASE_URL doesn't point to aletheia_test, replace the database name
  if (existingUrl && !existingUrl.includes('/aletheia_test')) {
    // Replace database name in connection string with aletheia_test
    // Pattern: postgresql://user:pass@host:port/dbname?params or postgresql://user:pass@host:port/dbname
    const urlMatch = existingUrl.match(
      /^(postgresql:\/\/[^/]+\/)([^/?]+)(.*)$/,
    );
    if (urlMatch) {
      const [, prefix, , params] = urlMatch;
      process.env.DATABASE_URL = `${prefix}aletheia_test${params || ''}`;
    } else {
      // Fallback: try simple replacement
      process.env.DATABASE_URL = existingUrl.replace(
        /\/([^/?]+)(\?|$)/,
        '/aletheia_test$2',
      );
    }
  } else if (!existingUrl) {
    // Last resort fallback - should never be reached if .env.test is properly configured
    // This is only used if no .env files exist and no DATABASE_URL is set
    console.warn(
      '⚠️  WARNING: No DATABASE_URL found in environment. Using fallback test database URL.\n' +
        '   Please create .env.test file with proper DATABASE_URL pointing to aletheia_test database.',
    );
    process.env.DATABASE_URL =
      'postgresql://user:password@localhost:5432/aletheia_test';
  }
  // If it already contains /aletheia_test, keep it as is
}

// E2E must never depend on external OpenAI network calls.
process.env.OPENAI_DISABLE_NETWORK = 'true';

// Log which database we're using (only in test environment)
if (process.env.NODE_ENV !== 'production') {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : 'unknown';
  console.log(`[E2E Test Setup] Using database: ${dbName}`);
}

// Ensure the test DB schema is up-to-date for e2e runs (CI runs `npm run test:e2e`
// without an explicit migrate step).
// Also ensure e2e runs are isolated from leftover DB state. Unique/FK constraints
// will legitimately fail if prior data remains in `aletheia_test`.
//
// We do this once per jest process to keep pre-push/CI stable.
const alreadyPrepared =
  process.env.ALETHEIA_E2E_DB_PREPARED === '1' ||
  Boolean(e2eGlobal.__ALETHEIA_E2E_DB_PREPARED__);

if (!alreadyPrepared) {
  execSync(
    'npx dotenv-cli -e .env.test -- npx prisma migrate reset --force',
    {
      stdio: 'inherit',
      env: process.env,
    },
  );
  execSync('npx dotenv-cli -e .env.test -- npx tsx scripts/seed/testSeed.ts', {
    stdio: 'inherit',
    env: process.env,
  });
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env,
  });
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  process.env.ALETHEIA_E2E_DB_PREPARED = '1';
  e2eGlobal.__ALETHEIA_E2E_DB_PREPARED__ = true;
}
