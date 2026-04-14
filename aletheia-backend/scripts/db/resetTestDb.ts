/**
 * Drops the test database schema, reapplies migrations, and runs the deterministic test seed.
 * Usage (from aletheia-backend): npm run db:reset:test
 */
import { execSync } from 'child_process';
import { resolve } from 'path';

const backendRoot = resolve(__dirname, '..', '..');
process.chdir(backendRoot);

execSync(
  'npx dotenv-cli -e .env.test -- npx prisma migrate reset --force --skip-seed',
  {
    stdio: 'inherit',
    env: process.env,
  },
);

execSync('npx dotenv-cli -e .env.test -- npx tsx scripts/seed/testSeed.ts', {
  stdio: 'inherit',
  env: process.env,
});
