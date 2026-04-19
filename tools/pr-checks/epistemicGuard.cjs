#!/usr/bin/env node
/**
 * ADR-022 / ADR-038: PR Diff Epistemic Guard
 *
 * Scans git diff for forbidden terms and patterns.
 * Fails with EPISTEMIC_VIOLATION_DETECTED if violations found.
 *
 * Derived semantics are forbidden (ADR-022). User-guidance drift is forbidden (ADR-038).
 */

const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const LEXICON_PATH = path.join(__dirname, 'adr038Lexicon.json');
const LEXICON = JSON.parse(fs.readFileSync(LEXICON_PATH, 'utf8'));
const FORBIDDEN_TERMS = LEXICON.singleWordTerms;
const FORBIDDEN_PHRASES = LEXICON.phrases;

const FORBIDDEN_PATTERNS = ['.sort(', 'Math.max', 'Math.min', 'reduce('];

/**
 * Product-facing sources only: skip governance fixtures, ADRs, tests, and mechanical helpers
 * where literals (e.g. "best match" in docs) or pagination clamps are not user-facing semantics.
 */
function shouldScanFilePath(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (p.startsWith('tools/')) return false;
  if (p.startsWith('docs/')) return false;
  if (p.startsWith('.github/')) return false;
  if (p.startsWith('.cursor/')) return false;
  if (p.startsWith('scripts/')) return false;
  if (p.includes('aletheia-backend/scripts/')) return false;
  if (p.includes('/schema-lint') || p.includes('graphql-lint')) return false;
  if (p.includes('list-pagination')) return false;
  if (p.includes('pagination-edge-cases')) return false;
  if (p.endsWith('aletheia-bundle.service.ts')) return false;
  if (p.includes('/e2e/') || p.includes('.e2e-spec.')) return false;
  if (p.includes('/__tests__/')) return false;
  if (p.endsWith('.spec.ts') || p.endsWith('.spec.tsx')) return false;
  if (p.endsWith('.test.ts') || p.endsWith('.test.tsx')) return false;
  return true;
}

function getDiff() {
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA;
  const opts = { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 };
  const silent = { ...opts, stdio: ['pipe', 'pipe', 'pipe'] };

  if (baseSha && headSha) {
    try {
      return execSync(`git diff ${baseSha}...${headSha} --unified=0`, silent);
    } catch {
      return '';
    }
  }

  const base = process.env.GITHUB_BASE_REF || process.env.GITHUB_DEFAULT_BRANCH || 'main';
  try {
    return execSync(`git diff origin/${base}...HEAD --unified=0`, opts);
  } catch {
    try {
      return execSync('git diff --cached --unified=0', opts);
    } catch {
      try {
        return execSync('git diff HEAD --unified=0', opts);
      } catch {
        return '';
      }
    }
  }
}

function isExemptGuardOrDocLine(content) {
  return /assertNoDerived|assertNoConfidence|epistemicGuard|ADR-006|ADR-010|ADR-019|ADR-020|ADR-022|ADR-025|ADR-033|ADR-037|ADR-038|agentRoleGuard|forbidden|noSemanticQueries|schema-lint|FORBIDDEN_IMPORT_KEYS|GraphQL contract|Unexpected field/i.test(
    content,
  );
}

function main() {
  const diff = getDiff();
  /** @type {string | null} */
  let currentFile = null;

  const violations = [];
  const seen = new Set();

  for (const line of diff.split('\n')) {
    const fileHeader = line.match(/^\+\+\+ b\/(.+)/);
    if (fileHeader) {
      currentFile = fileHeader[1];
      continue;
    }

    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    if (!currentFile || !shouldScanFilePath(currentFile)) continue;

    const content = line.slice(1);
    const lower = content.toLowerCase();

    const isComment = /^\s*[/*#]|^\s*\/\//.test(content.trim());
    const isGuardOrDoc = isExemptGuardOrDocLine(content);

    if (!isComment && !isGuardOrDoc) {
      for (const term of FORBIDDEN_TERMS) {
        const re = new RegExp(`\\b${term}\\b`, 'i');
        if (re.test(lower) && !seen.has(`${currentFile}:term:${term}`)) {
          violations.push(`Forbidden term "${term}" in ${currentFile}`);
          seen.add(`${currentFile}:term:${term}`);
        }
      }

      for (const phrase of FORBIDDEN_PHRASES) {
        const p = phrase.toLowerCase();
        if (lower.includes(p) && !seen.has(`${currentFile}:phrase:${p}`)) {
          violations.push(`Forbidden phrase "${phrase}" in ${currentFile}`);
          seen.add(`${currentFile}:phrase:${p}`);
        }
      }
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.includes(pattern)) {
        const isCommentInner = /^\s*[/*#]|^\s*\/\//.test(content.trim());
        const isNodeModules = content.includes('node_modules');
        if (!isCommentInner && !isNodeModules) {
          violations.push(`Forbidden pattern "${pattern}" in ${currentFile}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('EPISTEMIC_VIOLATION_DETECTED');
    console.error('Violations:');
    [...new Set(violations)].forEach((v) => console.error(`  - ${v}`));
    console.error('\nDerived semantics are forbidden (ADR-022). User-guidance drift is forbidden (ADR-038).');
    process.exit(1);
  }
  process.exit(0);
}

main();
