#!/usr/bin/env node
/**
 * ADR-025: Mechanical governance CLI (no inference).
 *
 * - Schema lint (ADR-022/023/024/025 + snapshots expected to be run in CI separately as needed)
 * - ADR document hygiene
 * - PR diff agent-role guard for frontend app code
 *
 * Usage: node tools/governance-bot/governance-bot.cjs --base <sha> --head <sha>
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  let base;
  let head;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--base' && argv[i + 1]) {
      base = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--head' && argv[i + 1]) {
      head = argv[i + 1];
      i += 1;
    }
  }
  return { base, head };
}

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function main() {
  const { base, head } = parseArgs(process.argv);

  run('npm run schema:lint');
  run('npm run adr:check');

  const guardEnv = {};
  if (base && head) {
    guardEnv.GIT_DIFF_BASE = base;
    guardEnv.GIT_DIFF_HEAD = head;
  }
  run('node tools/pr-checks/agentRoleGuard.cjs', guardEnv);

  console.log('Governance bot: all mechanical checks passed.');
}

main();
