#!/usr/bin/env node

/**
 * Script to check if new resolvers/endpoints have corresponding e2e tests
 * Usage: node scripts/check-e2e-tests.js [changed-files...]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../test');
const RESOLVER_PATTERN = /src\/graphql\/resolvers\/(.+)\.resolver\.ts$/;
const MAIN_E2E_FILE = path.join(TEST_DIR, 'graphql.e2e-spec.ts');

function checkE2ETests(changedFiles) {
  const changedResolvers = [];
  const missingTests = [];

  // Find changed resolvers
  changedFiles.forEach(file => {
    const match = file.match(RESOLVER_PATTERN);
    if (match) {
      const resolverName = match[1];
      changedResolvers.push(resolverName);
    }
  });

  if (changedResolvers.length === 0) {
    console.log('✓ No resolver changes detected');
    return true;
  }

  console.log(`\n📋 Detected ${changedResolvers.length} resolver change(s):`);
  changedResolvers.forEach(name => console.log(`   - ${name}.resolver.ts`));

  // Check if e2e tests exist
  changedResolvers.forEach(resolverName => {
    const e2eTestFile = path.join(TEST_DIR, `${resolverName}.e2e-spec.ts`);
    const hasDedicatedTest = fs.existsSync(e2eTestFile);
    
    // Check if it's covered in the main graphql.e2e-spec.ts
    let hasMainTest = false;
    if (fs.existsSync(MAIN_E2E_FILE)) {
      const mainTestContent = fs.readFileSync(MAIN_E2E_FILE, 'utf-8');
      // Simple check - look for resolver name or common query/mutation patterns
      const resolverPattern = new RegExp(
        `(${resolverName}|${resolverName.charAt(0).toUpperCase() + resolverName.slice(1)})`,
        'i'
      );
      hasMainTest = resolverPattern.test(mainTestContent);
    }

    if (!hasDedicatedTest && !hasMainTest) {
      missingTests.push(resolverName);
    }
  });

  if (missingTests.length > 0) {
    console.log('\n⚠️  Warning: Missing e2e tests for:');
    missingTests.forEach(name => console.log(`   - ${name}`));
    console.log('\n💡 Please add e2e tests:');
    console.log('   - Create test/<resolver>.e2e-spec.ts, or');
    console.log('   - Add tests to test/graphql.e2e-spec.ts');
    console.log('\n📖 See test/TESTING_GUIDELINES.md for guidelines.\n');
    return false;
  }

  console.log('\n✓ All changed resolvers have e2e tests\n');
  return true;
}

// Get changed files from command line or git diff
const args = process.argv.slice(2);
let changedFiles = [];

if (args.length > 0) {
  changedFiles = args;
} else {
  // Try to get from git diff (if in git repo)
  try {
    const gitDiff = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    changedFiles = gitDiff.split('\n').filter(Boolean);
  } catch (error) {
    console.log('⚠️  Could not detect changed files from git');
    console.log('   Usage: node scripts/check-e2e-tests.js [file1] [file2] ...\n');
    process.exit(0);
  }
}

const hasAllTests = checkE2ETests(changedFiles);
process.exit(hasAllTests ? 0 : 1);

