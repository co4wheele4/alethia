#!/usr/bin/env node
/**
 * ADR-025: Agent Role Restrictions — PR diff guard
 *
 * Scans added lines in frontend app sources for user-facing copy that implies
 * agent authority (recommendations, verdicts, comparative strength).
 *
 * Mechanical pattern match only; no interpretation of meaning.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../..');

/** Lowercase phrases that must not appear in new UI/product code. */
const FORBIDDEN_PHRASES = [
  'agent recommendation',
  'ai recommendation',
  'ai recommends',
  'recommended verdict',
  'likely true',
  'strongest evidence',
  'weakest evidence',
];

function getDiff() {
  const opts = { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: REPO_ROOT };
  /** Suppress git stderr for expected fallback attempts (e.g. missing origin/main). */
  const silent = { ...opts, stdio: ['pipe', 'pipe', 'pipe'] };

  const base = process.env.GIT_DIFF_BASE || process.env.BASE_SHA;
  const head = process.env.GIT_DIFF_HEAD || process.env.HEAD_SHA;
  if (base && head) {
    try {
      return execSync(`git diff ${base}...${head} --unified=0`, silent);
    } catch {
      return '';
    }
  }

  try {
    return execSync('git diff HEAD --unified=0', silent);
  } catch {
    /* empty */
  }
  const fallbackBase = process.env.GITHUB_BASE_REF || process.env.GITHUB_DEFAULT_BRANCH || 'main';
  try {
    return execSync(`git diff origin/${fallbackBase}...HEAD --unified=0`, silent);
  } catch {
    /* empty */
  }
  try {
    return execSync('git diff --cached --unified=0', silent);
  } catch {
    return '';
  }
}

function isExcludedPath(filePath) {
  return (
    filePath.includes('/node_modules/') ||
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('/e2e/') ||
    filePath.includes('/__tests__/') ||
    filePath.includes('/docs/adr/') ||
    filePath.includes('tools/pr-checks/agentRoleGuard.cjs') ||
    filePath.includes('tools/governance-bot/')
  );
}

function parseDiffFiles(diff) {
  /** @type {string | null} */
  let currentFile = null;
  const lines = diff.split('\n');
  const violations = [];

  for (const line of lines) {
    const m = line.match(/^\+\+\+ b\/(.+)/);
    if (m) {
      currentFile = m[1].trim();
      continue;
    }
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    if (!currentFile || isExcludedPath(currentFile)) continue;
    if (!/^aletheia-frontend\/app\//.test(currentFile)) continue;
    if (!/\.(tsx|ts|jsx|js)$/.test(currentFile)) continue;

    const body = line.slice(1);
    const lower = body.toLowerCase();

    if (/ADR-025|forbidden phrase|agentRoleGuard/i.test(body)) continue;
    if (/^\s*(\/\/|\/\*|\*|#)/.test(body.trim())) continue;

    for (const phrase of FORBIDDEN_PHRASES) {
      if (lower.includes(phrase)) {
        violations.push({ file: currentFile, phrase, line: body.trim().slice(0, 200) });
      }
    }
  }

  return violations;
}

function main() {
  const diff = getDiff();
  const violations = parseDiffFiles(diff);

  if (violations.length > 0) {
    console.error('ADR-025_AGENT_ROLE_VIOLATION');
    console.error('Forbidden agent-authority UI phrasing in diff:');
    for (const v of violations) {
      console.error(`  - ${v.file}: "${v.phrase}"`);
      console.error(`    ${v.line}`);
    }
    console.error('\nAgent outputs must not read as recommendations or verdicts (ADR-025).');
    process.exit(1);
  }
  process.exit(0);
}

main();
