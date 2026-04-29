/**
 * Ensure a production Next build exists before `next start` (Playwright webServer).
 *
 * Why: `next build` can take a long time; Playwright's webServer has a max wait budget, so
 * we prefer running `npm run build` in CI / hooks when possible, and only build here on-demand.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = process.cwd();
const buildId = path.join(root, '.next', 'BUILD_ID');

if (fs.existsSync(buildId)) {
  process.exit(0);
}

// Keep logs on stderr; stdout is reserved for scripts that pipe machine-readable output.
process.stderr.write('[playwright-ensure-build] No .next/BUILD_ID found; running npm run build...\n');
execSync('npm run build', { stdio: 'inherit', env: process.env, windowsHide: true });
