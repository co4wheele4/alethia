/**
 * Monorepo entrypoint: delegates to aletheia-backend reset script.
 * Run: `node scripts/db/resetTestDb.cjs` or `npm run db:reset:test` from the repo root.
 * @see docs/dev/test-seed.md
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(
  npm,
  ['run', 'db:reset:test', '--workspace=aletheia-backend'],
  { stdio: 'inherit', cwd: repoRoot, env: process.env },
);
process.exit(result.status === null ? 1 : result.status);
