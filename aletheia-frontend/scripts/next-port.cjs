/* eslint-disable no-console */
/**
 * Run Next.js with a port from env (default 3030).
 *
 * Why: npm scripts are cross-platform; we want `PORT=... npm run dev` to work on Windows and POSIX.
 */

const { spawn } = require('node:child_process');
const net = require('node:net');

function parsePort(value, fallback) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  return fallback;
}

function canBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (err) => resolve({ ok: false, err }));
    server.listen({ port, host }, () => {
      server.close(() => resolve({ ok: true, err: null }));
    });
  });
}

async function isPortFree(port) {
  const v4 = await canBind(port, '0.0.0.0');
  if (!v4.ok && v4.err && v4.err.code === 'EADDRINUSE') return false;

  const v6 = await canBind(port, '::');
  if (!v6.ok && v6.err && v6.err.code === 'EADDRINUSE') return false;

  if (!v6.ok && v6.err && (v6.err.code === 'EAFNOSUPPORT' || v6.err.code === 'EINVAL')) {
    return v4.ok;
  }

  return v4.ok && v6.ok;
}

async function firstFreePort(startPort, maxTries = 50) {
  for (let p = startPort, i = 0; i < maxTries; i += 1, p += 1) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(p);
    if (free) return p;
  }
  throw new Error(`[next-port] No free port found in range [${startPort}, ${startPort + maxTries - 1}]`);
}

function main() {
  const mode = process.argv[2] || 'dev'; // "dev" | "start"
  const desiredPort = parsePort(process.env.PORT, 3030);

  void (async () => {
    const port = await firstFreePort(desiredPort);
    if (port !== desiredPort) {
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

