/**
 * Monorepo entrypoint: delegates to aletheia-backend (Prisma + generated client).
 * Run: `node scripts/seed/testSeed.cjs` or `npm run db:seed:test` from the repo root.
 * @see docs/dev/test-seed.md
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(
  npm,
  ['run', 'db:seed:test', '--workspace=aletheia-backend'],
  { stdio: 'inherit', cwd: repoRoot, env: process.env },
);
process.exit(result.status === null ? 1 : result.status);
