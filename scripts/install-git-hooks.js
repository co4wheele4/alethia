#!/usr/bin/env node
/**
 * Install version-controlled git hooks into .git/hooks.
 *
 * We avoid changing git config (core.hooksPath) so this works
 * without any global/local git configuration changes.
 */

const fs = require('fs');
const path = require('path');

function main() {
  const repoRoot = process.cwd();
  const gitDir = path.join(repoRoot, '.git');
  const hooksDir = path.join(gitDir, 'hooks');

  // Skip in environments without a .git directory (e.g. some CI artifacts).
  if (!fs.existsSync(gitDir) || !fs.existsSync(hooksDir)) {
    return;
  }

  const src = path.join(repoRoot, 'scripts', 'git-hooks', 'pre-push');
  const dst = path.join(hooksDir, 'pre-push');

  if (!fs.existsSync(src)) {
    throw new Error(`Missing hook template at ${src}`);
  }

  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dst, content, { encoding: 'utf8' });

  // Best-effort chmod for non-Windows.
  try {
    fs.chmodSync(dst, 0o755);
  } catch {
    // ignore
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    // Don't fail installs because of hook installation issues.
    // eslint-disable-next-line no-console
    console.warn(`[install-git-hooks] ${e && e.message ? e.message : String(e)}`);
  }
}

