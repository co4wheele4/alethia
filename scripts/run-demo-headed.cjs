/* eslint-disable no-console */
/**
 * Headed Playwright walkthrough against a locally started dev stack (see e2e/full-demo-walkthrough.spec.ts).
 * Invoked from `npm run demo -- --headed --seed` or `npm run demo:headed`.
 */
const fs = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const { root, getChildEnvAfterSeed } = require('./demo-env.cjs');

const stackPortsFile = path.join(root, '.dev-stack-ports.json');

/**
 * Written by `start-dev-auto.cjs` so we wait on the spawned stack’s ports (not another process on 3000).
 * @param {number} timeoutMs
 * @returns {Promise<{ backendPort: number, frontendPort: number } | null>}
 */
async function readStackPorts(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (fs.existsSync(stackPortsFile)) {
        const j = JSON.parse(fs.readFileSync(stackPortsFile, 'utf8'));
        if (
          typeof j.backendPort === 'number' &&
          typeof j.frontendPort === 'number' &&
          Number.isFinite(j.backendPort) &&
          Number.isFinite(j.frontendPort)
        ) {
          return { backendPort: j.backendPort, frontendPort: j.frontendPort };
        }
      }
    } catch {
      // keep polling
    }
    await sleep(100);
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Dev stack may bind 3030+ if busy. Prefer `.dev-stack-ports.json` from `start-dev-auto.cjs`.
 * @param {number | null} preferredPort
 * @param {number} timeoutMs
 * @returns {Promise<{ baseUrl: string, port: number }>}
 */
async function waitForFrontendReady(preferredPort, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const portsToTry =
      preferredPort != null
        ? [preferredPort]
        : Array.from({ length: 19 }, (_, i) => 3030 + i);
    for (const port of portsToTry) {
      const baseUrl = `http://127.0.0.1:${port}`;
      try {
        const res = await fetch(`${baseUrl}/`, { method: 'GET' });
        if (res.ok) return { baseUrl, port };
      } catch {
        // try next port
      }
    }
    await sleep(400);
  }
  throw new Error(
    preferredPort != null
      ? `Frontend not reachable on 127.0.0.1:${preferredPort} within timeout`
      : 'Frontend not reachable on 127.0.0.1:3030–3048 within timeout',
  );
}

/**
 * Next.js can serve before Nest finishes compiling — login needs the API.
 * Waits for the Nest root route on the port chosen by `start-dev-auto` (see `.dev-stack-ports.json`).
 * @param {number | null} preferredPort
 * @param {number} timeoutMs
 * @returns {Promise<number>} port
 */
async function waitForBackendReady(preferredPort, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const portsToTry =
      preferredPort != null
        ? [preferredPort]
        : Array.from({ length: 16 }, (_, i) => 3000 + i);
    for (const port of portsToTry) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`, { method: 'GET' });
        if (res.ok) {
          console.log(`[demo] Backend ready at http://127.0.0.1:${port}/`);
          return port;
        }
      } catch {
        // try next port
      }
    }
    await sleep(500);
  }
  throw new Error(
    preferredPort != null
      ? `Backend not reachable on 127.0.0.1:${preferredPort} within timeout`
      : 'Backend not reachable on 127.0.0.1:3000–3015 within timeout',
  );
}

function killProcessTree(pid) {
  if (!pid) return;
  const { execSync } = require('node:child_process');
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        process.kill(pid, 'SIGTERM');
      }
    }
  } catch {
    // ignore
  }
}

function npmRun(scriptName, cwd, env = process.env) {
  const isWin = process.platform === 'win32';
  return spawnSync(`npm run ${scriptName}`, {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env,
  });
}

/**
 * @param {{ seed?: boolean, noVerify?: boolean }} opts
 * @returns {Promise<number>} exit code
 */
async function runHeadedDemo(opts) {
  const { seed = false, noVerify = false } = opts;

  if (!noVerify) {
    const r = npmRun('verify:demo-ids', root);
    if (r.status !== 0) return typeof r.status === 'number' ? r.status : 1;
  }

  if (seed) {
    console.log('[demo] Seeding test database (must target aletheia_test; see docs/dev/test-seed.md)…');
    const r = npmRun('db:seed:test', root);
    if (r.status !== 0) {
      console.error(
        '[demo] Seed failed. Ensure PostgreSQL is running and aletheia-backend/.env.test has DATABASE_URL with database name aletheia_test.',
      );
      return typeof r.status === 'number' ? r.status : 1;
    }
  }

  const childEnv = getChildEnvAfterSeed(seed);

  console.log('[demo] Starting backend + frontend for headed walkthrough…');
  const child = spawn(process.execPath, [path.join(root, 'scripts', 'start-dev-auto.cjs')], {
    cwd: root,
    stdio: 'inherit',
    env: childEnv,
  });

  let baseUrl = 'http://127.0.0.1:3030';
  try {
    const stackPorts = await readStackPorts(30_000);
    if (!stackPorts) {
      console.warn(
        '[demo] No .dev-stack-ports.json yet; falling back to scanning ports (prefer a clean 3000/3030 or fix start-dev-auto).',
      );
    }
    const preferredFe = stackPorts?.frontendPort ?? null;
    const preferredBe = stackPorts?.backendPort ?? null;

    const ready = await waitForFrontendReady(preferredFe, 120_000);
    baseUrl = ready.baseUrl;
    console.log(`[demo] Frontend ready at ${baseUrl}`);
    await waitForBackendReady(preferredBe, 180_000);
  } catch (e) {
    console.error(String(e?.message || e));
    killProcessTree(child.pid);
    return 1;
  }

  const fe = {
    ...childEnv,
    PLAYWRIGHT_TEST_BASE_URL: baseUrl,
    PLAYWRIGHT_REAL_BACKEND: '1',
  };

  console.log('[demo] Running headed Playwright walkthrough (e2e/full-demo-walkthrough.spec.ts)…');
  const isWin = process.platform === 'win32';
  const pw = spawnSync(
    `npx playwright test --config=playwright.demo.config.ts --headed --project=chromium`,
    {
      cwd: path.join(root, 'aletheia-frontend'),
      stdio: 'inherit',
      shell: isWin,
      env: fe,
    },
  );

  killProcessTree(child.pid);
  return typeof pw.status === 'number' ? pw.status : 1;
}

module.exports = { runHeadedDemo };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const seed = argv.includes('--seed');
  const noVerify = argv.includes('--no-verify');
  runHeadedDemo({ seed, noVerify }).then((code) => process.exit(code));
}
