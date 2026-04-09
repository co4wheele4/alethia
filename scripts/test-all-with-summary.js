#!/usr/bin/env node

/**
 * Test Runner Script with Summary
 * 
 * Runs all tests (frontend unit, frontend e2e, backend unit, backend e2e)
 * and displays a comprehensive summary at the end.
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Test results storage
const results = {
  'Frontend Linting': { status: 'pending', output: '', duration: 0, coverage: null },
  'Frontend Type Checking': { status: 'pending', output: '', duration: 0, coverage: null },
  'Frontend Unit Tests': { status: 'pending', output: '', duration: 0, coverage: null },
  'Frontend E2E Tests': { status: 'pending', output: '', duration: 0, coverage: null },
  'Backend Linting': { status: 'pending', output: '', duration: 0, coverage: null },
  'Backend Type Checking': { status: 'pending', output: '', duration: 0, coverage: null },
  'Backend Unit Tests': { status: 'pending', output: '', duration: 0, coverage: null },
  'Backend E2E Tests': { status: 'pending', output: '', duration: 0, coverage: null },
};

/**
 * Run a test command and capture output
 */
function runTest(name, command, cwd) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}Running: ${name}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

    const startTime = Date.now();
    let output = '';
    let errorOutput = '';

    const isWindows = process.platform === 'win32';
    const child = (() => {
      if (isWindows) {
        // On Windows, `.cmd` shims require `cmd.exe` (CreateProcess cannot execute them directly).
        // We avoid Node's `shell: true` (DEP0190 warning) by spawning cmd.exe explicitly.
        const comspec = process.env.ComSpec || 'cmd.exe';
        return spawn(comspec, ['/d', '/s', '/c', command], {
          cwd: cwd || process.cwd(),
          stdio: ['inherit', 'pipe', 'pipe'],
        });
      }

      // Non-Windows: run directly without a shell.
      const parts = command.split(/\s+/);
      const executable = parts[0];
      const args = parts.slice(1);
      return spawn(executable, args, {
        cwd: cwd || process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
      });
    })();

    // Capture stdout
    child.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text); // Display in real-time
      output += text;
    });

    // Capture stderr
    child.stderr.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text); // Display in real-time
      errorOutput += text;
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const combinedOutput = output + errorOutput;
      
      results[name] = {
        status: code === 0 ? 'passed' : 'failed',
        output: combinedOutput,
        duration: parseFloat(duration),
        exitCode: code,
      };

      if (code !== 0) {
        console.log(`\n${colors.red}${colors.bright}✗ ${name} FAILED (Exit Code: ${code})${colors.reset}`);
      } else {
        console.log(`\n${colors.green}${colors.bright}✓ ${name} PASSED${colors.reset}`);
      }
      
      resolve(code === 0);
    });

    child.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      results[name] = {
        status: 'failed',
        output: error.message,
        duration: parseFloat(duration),
        exitCode: 1,
      };
      resolve(false);
    });
  });
}

/**
 * Extract test statistics and failing test files from output
 */
function extractStats(output, testType) {
  const stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    failingFiles: [],
    coverage: null,
  };

  if (!output) return stats;

  if (testType === 'jest' || testType === 'vitest') {
    // Jest/Vitest output format examples:
    // "Tests:       5 passed, 2 failed, 1 skipped, 8 total"
    // "Test Suites: 12 passed, 12 total"
    // "Tests:       56 passed, 56 total"
    // Vitest: "Tests  5 passed (5)"
    const testMatch = output.match(/Tests:?\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?(?:,\s+(\d+)\s+total)?/i) ||
                     output.match(/Tests\s+(\d+)\s+passed/i);
    
    if (testMatch) {
      stats.passed = parseInt(testMatch[1]) || 0;
      stats.failed = parseInt(testMatch[2]) || 0;
      stats.skipped = parseInt(testMatch[3]) || 0;
      stats.total = parseInt(testMatch[4]) || stats.passed + stats.failed + stats.skipped;
    } else {
      // Try alternative format: "56 passed, 56 total"
      const altMatch = output.match(/(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?(?:,\s+(\d+)\s+total)?/i);
      if (altMatch) {
        stats.passed = parseInt(altMatch[1]) || 0;
        stats.failed = parseInt(altMatch[2]) || 0;
        stats.skipped = parseInt(altMatch[3]) || 0;
        stats.total = parseInt(altMatch[4]) || stats.passed + stats.failed + stats.skipped;
      }
    }

    // Extract coverage
    // Format: All files |   97.22 |   83.33 |   94.11 |   97.22 |
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);
    if (coverageMatch) {
      stats.coverage = {
        statements: coverageMatch[1],
        branches: coverageMatch[2],
        functions: coverageMatch[3],
        lines: coverageMatch[4],
      };
    }
  } else if (testType === 'playwright') {
    // Playwright output format: "5 passed (8.8s)" or "20 passed, 5 skipped"
    const playwrightMatch = output.match(/(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+skipped)?/i);
    if (playwrightMatch) {
      stats.passed = parseInt(playwrightMatch[1]) || 0;
      stats.failed = parseInt(playwrightMatch[2]) || 0;
      stats.skipped = parseInt(playwrightMatch[3]) || 0;
      stats.total = stats.passed + stats.failed + stats.skipped;
    }

    // Extract failing playwright tests
    const pwFailMatch = output.matchAll(/\d+\)\s+\[[^\]]+\]\s+›\s+([^\n]+)/g);
    for (const match of pwFailMatch) {
      if (match[1] && !stats.failingFiles.includes(match[1])) {
        stats.failingFiles.push(match[1]);
      }
    }
  } else if (testType === 'lint') {
    // ESLint format: "✖ 5 problems (5 errors, 0 warnings)"
    const lintMatch = output.match(/✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?/i);
    let lintErrorCount = 0;
    if (lintMatch) {
      lintErrorCount = parseInt(lintMatch[2], 10) || 0;
      stats.failed = lintErrorCount;
      stats.total = lintErrorCount;
    }

    // Only list paths when there are errors — warnings still exit 0 but list files, which is not a "failure".
    if (lintErrorCount > 0) {
      const lintFileMatches = output.matchAll(/^([^\s\n]+\.[jt]sx?)/gm);
      for (const match of lintFileMatches) {
        if (match[1] && !match[1].includes('node_modules') && !stats.failingFiles.includes(match[1])) {
          stats.failingFiles.push(match[1]);
        }
      }
    }
  } else if (testType === 'type-check') {
    // TypeScript format: "app/file.ts(10,5): error TS1234: Message"
    const errorMatch = output.matchAll(/error TS\d+:/g);
    let count = 0;
    for (const match of errorMatch) {
      count++;
    }
    if (count > 0) {
      stats.failed = count;
      stats.total = count;
    }

    // Extract files with type errors
    const typeFileMatches = output.matchAll(/^([^\s\n(]+\.[jt]sx?)/gm);
    for (const match of typeFileMatches) {
      if (match[1] && !match[1].includes('node_modules') && !stats.failingFiles.includes(match[1])) {
        stats.failingFiles.push(match[1]);
      }
    }
  }

  // Jest/Vitest print "FAIL path/to/file.test.tsx" for failed suites. Coverage and other tools can
  // also emit lines containing "FAIL" plus a file path (e.g. uncovered line refs); only parse these
  // when the test run actually reported failed tests.
  if (
    (testType === 'jest' || testType === 'vitest') &&
    stats.failed > 0
  ) {
    const failMatches = output.matchAll(/(?:^|\r?\n)FAIL\s+([^\s\r\n]+)/gm);
    for (const match of failMatches) {
      if (match[1] && !stats.failingFiles.includes(match[1])) {
        stats.failingFiles.push(match[1]);
      }
    }
  }

  return stats;
}

/**
 * Display test summary
 */
function displaySummary() {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalDuration = 0;
  let totalSuiteTests = 0; // Track total tests across all suites

  Object.entries(results).forEach(([name, result]) => {
    const statusIcon = result.status === 'passed' ? '✓' : '✗';
    const statusColor = result.status === 'passed' ? colors.green : colors.red;
    const durationStr = `${result.duration.toFixed(2)}s`;

    console.log(`${statusColor}${statusIcon}${colors.reset} ${colors.bright}${name}${colors.reset}`);
    console.log(`   Status: ${statusColor}${result.status.toUpperCase()}${colors.reset}`);
    console.log(`   Duration: ${colors.gray}${durationStr}${colors.reset}`);

    // Determine test type
    let testType = 'jest';
    if (name.includes('E2E') && name.includes('Frontend')) {
      testType = 'playwright';
    } else if (name.includes('Frontend') && name.includes('Unit')) {
      testType = 'vitest';
    } else if (name.includes('Linting')) {
      testType = 'lint';
    } else if (name.includes('Type Checking')) {
      testType = 'type-check';
    }
    
    // Try to extract stats from output
    let stats = extractStats(result.output, testType);
    if (stats.total > 0) {
      console.log(`   Tests: ${colors.green}${stats.passed} passed${colors.reset}, ${colors.red}${stats.failed} failed${colors.reset}, ${colors.yellow}${stats.skipped} skipped${colors.reset}, ${colors.bright}${stats.total} total${colors.reset}`);
      totalPassed += stats.passed;
      totalFailed += stats.failed;
      totalSkipped += stats.skipped;
      totalSuiteTests += stats.total;
    } else {
      // If we can't extract stats, try to get them from the last few lines of output
      const lines = result.output.split('\n').filter(l => l.trim());
      const lastLines = lines.slice(-10).join('\n');
      const stats2 = extractStats(lastLines, testType);
      if (stats2.total > 0) {
        stats = stats2;
        console.log(`   Tests: ${colors.green}${stats2.passed} passed${colors.reset}, ${colors.red}${stats2.failed} failed${colors.reset}, ${colors.yellow}${stats2.skipped} skipped${colors.reset}, ${colors.bright}${stats2.total} total${colors.reset}`);
        totalPassed += stats2.passed;
        totalFailed += stats2.failed;
        totalSkipped += stats2.skipped;
        totalSuiteTests += stats2.total;
      }
    }

    // Display failing test files if any
    const allStats = stats.total > 0 ? stats : extractStats(result.output, testType);
    if (allStats.failingFiles && allStats.failingFiles.length > 0) {
      console.log(`   ${colors.red}Failing Test Files:${colors.reset}`);
      allStats.failingFiles.forEach((file) => {
        console.log(`      ${colors.red}✗${colors.reset} ${file}`);
      });
    }

    // Display coverage if available
    if (allStats.coverage) {
      console.log(`   Coverage: ${colors.cyan}${allStats.coverage.lines}% lines${colors.reset}, ${colors.cyan}${allStats.coverage.functions}% functions${colors.reset}, ${colors.cyan}${allStats.coverage.statements}% statements${colors.reset}`);
    }

    totalDuration += result.duration;
    console.log('');
  });

  // Overall summary
  console.log(`${colors.cyan}${'-'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}Overall Summary:${colors.reset}`);
  console.log(`   Total Duration: ${colors.gray}${totalDuration.toFixed(2)}s${colors.reset}`);
  if (totalPassed + totalFailed + totalSkipped > 0) {
    const totalTests = totalPassed + totalFailed + totalSkipped;
    console.log(`   Total Tests: ${colors.green}${totalPassed} passed${colors.reset}, ${colors.red}${totalFailed} failed${colors.reset}, ${colors.yellow}${totalSkipped} skipped${colors.reset}, ${colors.bright}${totalTests} total${colors.reset}`);
    if (totalSuiteTests > 0 && totalSuiteTests !== totalTests) {
      console.log(`   Total Suite Tests: ${colors.bright}${totalSuiteTests}${colors.reset}`);
    }
  }
  
  const allPassed = Object.values(results).every(r => r.status === 'passed');
  const passRate = totalPassed + totalFailed + totalSkipped > 0 
    ? ((totalPassed / (totalPassed + totalFailed + totalSkipped)) * 100).toFixed(1)
    : '0.0';
  console.log(`   Pass Rate: ${colors.gray}${passRate}%${colors.reset}`);
  
  // List failed test suites
  const failedSuites = Object.entries(results)
    .filter(([_, result]) => result.status === 'failed')
    .map(([name, _]) => name);
  
  if (failedSuites.length > 0) {
    console.log(`\n   ${colors.red}${colors.bright}Failed Test Suites:${colors.reset}`);
    failedSuites.forEach((suiteName) => {
      console.log(`      ${colors.red}✗${colors.reset} ${suiteName}`);
    });
  }
  
  console.log(`   Overall Status: ${allPassed ? colors.green + 'ALL TESTS PASSED' + colors.reset : colors.red + 'SOME TESTS FAILED' + colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

  return allPassed ? 0 : 1;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}Running All Tests${colors.reset}\n`);

  const rootDir = process.cwd();
  const frontendDir = path.join(rootDir, 'aletheia-frontend');
  const backendDir = path.join(rootDir, 'aletheia-backend');

  // Run all test suites sequentially
  const tests = [
    {
      name: 'Frontend Linting',
      command: 'npm run lint',
      cwd: frontendDir,
    },
    {
      name: 'Frontend Type Checking',
      command: 'npm run type-check',
      cwd: frontendDir,
    },
    {
      name: 'Frontend Unit Tests',
      command: 'npm run test:unit:cov',
      cwd: frontendDir,
    },
    {
      name: 'Frontend E2E Tests',
      command: 'npx playwright test',
      cwd: frontendDir,
    },
    {
      name: 'Backend Linting',
      command: 'npm run lint',
      cwd: backendDir,
    },
    {
      name: 'Backend Type Checking',
      command: 'npm run type-check',
      cwd: backendDir,
    },
    {
      name: 'Backend Unit Tests',
      command: 'npm run test:cov',
      cwd: backendDir,
    },
    {
      name: 'Backend E2E Tests',
      command: 'npm run test:e2e:cov',
      cwd: backendDir,
    },
  ];

  // Run tests sequentially
  for (const test of tests) {
    await runTest(test.name, test.command, test.cwd);
  }

  // Display summary
  const exitCode = displaySummary();
  process.exit(exitCode);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runTest, displaySummary, extractStats };
