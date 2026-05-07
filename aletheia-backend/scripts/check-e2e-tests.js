#!/usr/bin/env node
'use strict';

/**
 * Resolver ↔ e2e reminder: detects GraphQL resolver changes and reports whether
 * each has a dedicated e2e spec under test/e2e/resolvers/.
 *
 * Usage:
 *   node scripts/check-e2e-tests.js [changed-file...]
 *   node scripts/check-e2e-tests.js --git-range origin/main...HEAD
 *
 * Exits 0 (prints warnings when a dedicated spec is missing — non-blocking for CI).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const TEST_ROOT = path.join(BACKEND_ROOT, 'test');

/** Matches resolver paths from repo root or backend-relative. */
const RESOLVER_PATH =
  /(?:^|\/)(?:aletheia-backend\/)?src\/graphql\/resolvers\/(.+)\.resolver\.ts$/;

function extractResolverBase(repoRelativePath) {
  const norm = repoRelativePath.replace(/\\/g, '/').trim();
  const m = norm.match(RESOLVER_PATH);
  return m ? m[1] : null;
}

function dedicatedE2ePath(resolverBase) {
  return path.join(TEST_ROOT, 'e2e', 'resolvers', `${resolverBase}.resolver.e2e-spec.ts`);
}

function resolveChangedFiles(argv) {
  const rangeIdx = argv.findIndex((a) => a === '--git-range' || a.startsWith('--git-range='));
  if (rangeIdx !== -1) {
    let range;
    if (argv[rangeIdx].includes('=')) {
      range = argv[rangeIdx].split('=').slice(1).join('=');
    } else {
      range = argv[rangeIdx + 1];
    }
    if (!range) {
      console.error('check-e2e-tests: --git-range requires a value (e.g. origin/main...HEAD)');
      process.exit(2);
    }
    const out = execSync(`git diff --name-only ${range}`, {
      encoding: 'utf8',
      cwd: path.resolve(BACKEND_ROOT, '..'),
    });
    return out.split(/\r?\n/).filter(Boolean);
  }

  if (argv.length > 0) {
    return argv.filter((a) => !a.startsWith('--'));
  }

  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      cwd: path.resolve(BACKEND_ROOT, '..'),
    });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    console.log('⚠️  Could not read git diff; pass files as args or --git-range origin/<branch>...HEAD');
    return [];
  }
}

function checkE2EHints(changedFiles) {
  const resolverBases = [];
  for (const f of changedFiles) {
    const base = extractResolverBase(f);
    if (base) resolverBases.push(base);
  }

  if (resolverBases.length === 0) {
    console.log('✓ No GraphQL resolver file changes detected in this diff');
    return true;
  }

  const unique = [...new Set(resolverBases)];
  console.log(`\n📋 Resolver file(s) changed (${unique.length}):`);
  unique.forEach((name) => console.log(`   - ${name}.resolver.ts`));

  const missingDedicated = [];
  for (const name of unique) {
    if (!fs.existsSync(dedicatedE2ePath(name))) {
      missingDedicated.push(name);
    }
  }

  if (missingDedicated.length === 0) {
    console.log('\n✓ Each changed resolver has test/e2e/resolvers/<name>.resolver.e2e-spec.ts\n');
    return true;
  }

  console.log('\n⚠️  These changed resolvers have no dedicated e2e spec yet:');
  missingDedicated.forEach((name) => {
    console.log(`   - ${name} → add test/e2e/resolvers/${name}.resolver.e2e-spec.ts`);
  });
  console.log(
    '\n💡 If coverage lives only in cross-cutting e2e files, add a dedicated resolver spec when practical.',
  );
  console.log('📖 See test/e2e/README.md and test/TESTING_GUIDELINES.md (if present).\n');
  return true;
}

const argv = process.argv.slice(2);
const changedFiles = resolveChangedFiles(argv);
checkE2EHints(changedFiles);
process.exit(0);
