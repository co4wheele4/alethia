/**
 * Drops the test database schema, reapplies migrations, and runs the deterministic test seed.
 * Usage (from aletheia-backend): npm run db:reset:test
 *
 * Prisma may block `migrate reset` when invoked from an AI agent unless you set
 * `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` to your explicit consent string (see Prisma docs).
 */
import { execSync } from 'child_process';
import { resolve } from 'path';

const backendRoot = resolve(__dirname, '..', '..');
process.chdir(backendRoot);

execSync(
  // Prisma CLI removed/does not support `--skip-seed` in current versions.
  // This script intentionally runs the deterministic seed explicitly below.
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
