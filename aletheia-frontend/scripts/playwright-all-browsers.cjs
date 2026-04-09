/**
 * Run Playwright with the full browser matrix (see playwright.config.ts).
 * Requires: npx playwright install
 */
const { spawnSync } = require('child_process');
const path = require('path');

process.env.PLAYWRIGHT_ALL_BROWSERS = '1';
const r = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});
process.exit(r.status ?? 1);
