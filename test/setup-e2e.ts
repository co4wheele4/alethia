// test/setup-e2e.ts
import 'dotenv/config';
import { execSync } from 'node:child_process';

// Set test environment variables if not already set
if (process.env.TEST_DATABASE_URL) {
  // Prefer explicitly-provided test DB URL (e.g. in CI).
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://user:password@localhost:5432/aletheia_test';
}

// Ensure the test DB schema is up-to-date for e2e runs (CI runs `npm run test:e2e`
// without an explicit migrate step).
if (!globalThis.__ALETHEIA_E2E_MIGRATED__) {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
  globalThis.__ALETHEIA_E2E_MIGRATED__ = true;
}
