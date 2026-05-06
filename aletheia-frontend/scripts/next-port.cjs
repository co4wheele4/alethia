/**
 * Run Next.js with a port from env (default 3030).
 *
 * Why: npm scripts are cross-platform; we want `PORT=... npm run dev` to work on Windows and POSIX.
 *
 * Port probing uses sibling `../../port-utils` (dev-port-utils); see repo `scripts/dev-port-utils.cjs`.
 */

const path = require('node:path');
const { spawn } = require('node:child_process');
const { firstFreePort, isPortFree } = require(path.join(__dirname, '..', '..', 'scripts', 'dev-port-utils.cjs'));

function parsePort(value, fallback) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  return fallback;
}

function main() {
  const mode = process.argv[2] || 'dev'; // "dev" | "start"
  const desiredPort = parsePort(process.env.PORT, 3030);

  void (async () => {
    const strictPort =
      process.env.NEXT_PORT_STRICT === '1' || String(process.env.NEXT_PORT_STRICT).toLowerCase() === 'true';
    if (strictPort) {
      const free = await isPortFree(desiredPort);
      if (!free) {
        console.error(
          `[next-port] Port ${desiredPort} is in use, but NEXT_PORT_STRICT is set. ` +
            `Free the port (or unset NEXT_PORT_STRICT) so Playwright/Next agree on a single port.`,
        );
        process.exit(1);
      }
    }

    const port = strictPort ? desiredPort : await firstFreePort(desiredPort);
    if (!strictPort && port !== desiredPort) {
      console.log(`[next-port] Port ${desiredPort} is in use; using ${port} instead.`);
    }

    // Ensure downstream code (and logs) see the resolved port.
    process.env.PORT = String(port);

    // Use the bundled Next CLI entrypoint (works across OSes).
    const nextBin = require.resolve('next/dist/bin/next');
    const args = [nextBin, mode, '-p', String(port)];

    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      if (typeof code === 'number') process.exit(code);
      // If terminated by signal, map to failure.
      console.error(`[next-port] exited via signal ${String(signal)}`);
      process.exit(1);
    });
  })().catch((err) => {
    console.error(String(err?.stack || err));
    process.exit(1);
  });
}

main();
