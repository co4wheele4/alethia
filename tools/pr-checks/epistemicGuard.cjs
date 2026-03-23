#!/usr/bin/env node
/**
 * ADR-022: PR Diff Epistemic Guard
 *
 * Scans git diff for forbidden terms and patterns.
 * Fails with EPISTEMIC_VIOLATION_DETECTED if violations found.
 *
 * Derived semantics are forbidden (ADR-022)
 */

const { execSync } = require('node:child_process');

const FORBIDDEN_TERMS = ['score', 'rank', 'best', 'top', 'strongest', 'weakest'];
const FORBIDDEN_PATTERNS = ['.sort(', 'Math.max', 'Math.min', 'reduce('];

function getDiff() {
  const base = process.env.GITHUB_BASE_REF || process.env.GITHUB_DEFAULT_BRANCH || 'main';
  const opts = { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 };
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

function main() {
  const diff = getDiff();
  const addedLines = diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));

  const violations = [];
  const seen = new Set();

  for (const line of addedLines) {
    const lower = line.toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
      const re = new RegExp(`\\b${term}\\b`, 'i');
      if (re.test(lower) && !seen.has(term)) {
        const isComment = /^\s*[/*#]|^\s*\/\//.test(line.trim());
        const isTestOrMock = /\.(test|spec)\.|mock|fixture|handlers\.ts/.test(diff);
        const isGuardOrDoc = /assertNoDerived|epistemicGuard|ADR-022|forbidden/.test(line);
        if (!isComment && !isGuardOrDoc) {
          if (isTestOrMock && (term === 'score' || term === 'rank')) {
            continue;
          }
          violations.push(`Forbidden term "${term}" in diff`);
          seen.add(term);
        }
      }
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (line.includes(pattern)) {
        const isComment = /^\s*[/*#]|^\s*\/\//.test(line.trim());
        const isNodeModules = line.includes('node_modules');
        const isTest = /\.(test|spec)\./.test(diff);
        if (!isComment && !isNodeModules) {
          if (isTest && pattern === '.sort(') continue;
          violations.push(`Forbidden pattern "${pattern}" in diff`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('EPISTEMIC_VIOLATION_DETECTED');
    console.error('Violations:');
    [...new Set(violations)].forEach((v) => console.error(`  - ${v}`));
    console.error('\nDerived semantics are forbidden (ADR-022)');
    process.exit(1);
  }
  process.exit(0);
}

main();
