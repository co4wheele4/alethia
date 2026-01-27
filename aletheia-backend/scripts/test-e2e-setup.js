// scripts/test-e2e-setup.js
//
// E2E DB setup helper that respects externally provided DATABASE_URL.
//
// - In CI, DATABASE_URL is typically injected by the runner (e.g. GitHub Actions service containers).
// - Locally, developers may rely on `.env.test`.
//
// This script avoids overriding DATABASE_URL when it is already set.

const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const hasDatabaseUrl = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;

if (hasDatabaseUrl) {
  run('npx prisma generate');
  run('npx prisma migrate deploy');
} else {
  run('npx dotenv-cli -e .env.test -- npx prisma generate');
  run('npx dotenv-cli -e .env.test -- npx prisma migrate deploy');
}

