/* eslint-disable no-console */
/**
 * Run NestJS with a port from env (default 3000), auto-incrementing if in use.
 *
 * Port probing uses sibling `../../port-utils` (dev-port-utils); see repo `scripts/dev-port-utils.cjs`.
 *
 * Usage:
 *   node scripts/nest-port.cjs dev
 *   node scripts/nest-port.cjs debug
 */

const path = require('node:path');
const { spawn } = require('node:child_process');
const { firstFreePort } = require(path.join(__dirname, '..', '..', 'scripts', 'dev-port-utils.cjs'));

function parsePort(value, fallback) {
  const n = Number(value);
  if (Number.isInteger(n) && n > 0 && n < 65536) return n;
  return fallback;
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
