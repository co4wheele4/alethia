/* eslint-disable no-console */
/**
 * Run NestJS with a port from env (default 3000), auto-incrementing if in use.
 *
 * Usage:
 *   node scripts/nest-port.cjs dev
 *   node scripts/nest-port.cjs debug
 */

const net = require('node:net');
const { spawn } = require('node:child_process');

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
  throw new Error(`[nest-port] No free port found in range [${startPort}, ${startPort + maxTries - 1}]`);
}

async function main() {
  const mode = process.argv[2] || 'dev';
  const desiredPort = parsePort(process.env.PORT, 3000);
  const port = await firstFreePort(desiredPort);

  if (port !== desiredPort) {
    console.log(`[nest-port] Port ${desiredPort} is in use; using ${port} instead.`);
  }

  process.env.PORT = String(port);

  const nestBin = require.resolve('@nestjs/cli/bin/nest.js');
  const args =
    mode === 'debug'
      ? [nestBin, 'start', '--debug', '--watch']
      : [nestBin, 'start', '--watch'];

  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (typeof code === 'number') process.exit(code);
    console.error(`[nest-port] exited via signal ${String(signal)}`);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});

