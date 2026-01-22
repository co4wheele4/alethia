#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Stop dev servers by killing processes listening on ports.
 *
 * Usage:
 *   npm run kill            # kills default ports (3000, 3030)
 *   npm run kill -- 3000    # kills only 3000
 *   npm run kill -- 3000 3030 4000
 */

const { execSync } = require('node:child_process');

function uniq(arr) {
  return Array.from(new Set(arr));
}

function parsePorts(argv) {
  const ports = argv
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0 && n < 65536);
  return ports.length ? ports : [3000, 3030];
}

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function killOnWindows(port) {
  // Use PowerShell + Get-NetTCPConnection (fast and reliable on Windows).
  const ps = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`;
  let out = '';
  try {
    out = run(`powershell -NoProfile -Command "${ps}"`);
  } catch {
    // If PowerShell isn't available or command fails, fall back to "no listener".
    out = '';
  }
  const pids = uniq(
    out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0)
  );

  if (pids.length === 0) return { port, killedPids: [] };

  for (const pid of pids) {
    // /T: kill child processes; /F: force
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Best effort: if it already exited, ignore.
    }
  }
  return { port, killedPids: pids };
}

function killOnPosix(port) {
  // Prefer lsof. If lsof isn't installed, fall back to fuser when available.
  const tryCommands = [
    `lsof -ti :${port}`,
    `lsof -ti tcp:${port}`,
  ];

  let pids = [];
  for (const cmd of tryCommands) {
    try {
      const out = run(cmd);
      pids = uniq(
        out
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => Number(s))
          .filter((n) => Number.isInteger(n) && n > 0)
      );
      if (pids.length) break;
    } catch {
      // try next
    }
  }

  if (pids.length === 0) {
    try {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      return { port, killedPids: ['(killed via fuser)'] };
    } catch {
      return { port, killedPids: [] };
    }
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Best effort
    }
  }
  return { port, killedPids: pids };
}

function main() {
  const ports = parsePorts(process.argv.slice(2));
  const isWindows = process.platform === 'win32';

  const results = ports.map((port) => (isWindows ? killOnWindows(port) : killOnPosix(port)));

  const killed = results.filter((r) => r.killedPids.length > 0);
  const none = results.filter((r) => r.killedPids.length === 0);

  if (killed.length) {
    for (const r of killed) {
      console.log(`Killed port ${r.port}: ${r.killedPids.join(', ')}`);
    }
  }
  if (none.length) {
    for (const r of none) {
      console.log(`No listener on port ${r.port}`);
    }
  }
}

main();

