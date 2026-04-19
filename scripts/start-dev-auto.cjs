/* eslint-disable no-console */
/**
 * Start backend + frontend dev servers on the first free ports.
 *
 * This avoids killing existing processes; instead we probe for free ports starting at:
 * - backend: 3000
 * - frontend: 3030
 *
 * Port selection uses the shared module under `C:\\dev\\port-utils` (override with `DEV_PORT_UTILS_ROOT`).
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.join(__dirname, '..');
const stackPortsFile = path.join(repoRoot, '.dev-stack-ports.json');

function writeStackPorts(backendPort, frontendPort) {
  fs.writeFileSync(
    stackPortsFile,
    JSON.stringify({ backendPort, frontendPort, updatedAt: Date.now() }, null, 0),
    'utf8',
  );
}

function removeStackPortsFile() {
  try {
    fs.unlinkSync(stackPortsFile);
  } catch {
    // ignore
  }
}

const portUtilsRoot = process.env.DEV_PORT_UTILS_ROOT || path.normalize('C:/dev/port-utils');
const { firstFreePort } = require(path.join(portUtilsRoot, 'index.cjs'));

function prefixStream(child, label) {
  const tag = `[${label}] `;
  const write = (chunk, stream) => {
    const text = String(chunk);
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === '' && i === lines.length - 1) continue;
      stream.write(tag + line + '\n');
    }
  };

  if (child.stdout) child.stdout.on('data', (c) => write(c, process.stdout));
  if (child.stderr) child.stderr.on('data', (c) => write(c, process.stderr));
}

async function main() {
  const backendDefault = 3000;
  const frontendDefault = 3030;

  const backendPort = await firstFreePort(backendDefault);
  const frontendPort = await firstFreePort(frontendDefault);

  if (backendPort !== backendDefault) {
    console.log(`Backend default port ${backendDefault} is in use; using ${backendPort} instead.`);
  }
  if (frontendPort !== frontendDefault) {
    console.log(`Frontend default port ${frontendDefault} is in use; using ${frontendPort} instead.`);
  }

  const allowedOrigins = [
    `http://localhost:${backendPort}`,
    `http://127.0.0.1:${backendPort}`,
    `http://localhost:${frontendPort}`,
    `http://127.0.0.1:${frontendPort}`,
  ].join(',');

  const backendEnv = {
    ...process.env,
    PORT: String(backendPort),
    ALLOWED_ORIGINS: allowedOrigins,
  };

  const frontendEnv = {
    ...process.env,
    PORT: String(frontendPort),
    NEXT_PUBLIC_GRAPHQL_URL: `http://127.0.0.1:${backendPort}/graphql`,
  };

  console.log(`Frontend: http://127.0.0.1:${frontendPort}`);
  console.log(`Backend GraphQL: http://127.0.0.1:${backendPort}/graphql`);

  writeStackPorts(backendPort, frontendPort);

  const isWin = process.platform === 'win32';
  const comspec = process.env.ComSpec || 'cmd.exe';

  const spawnNpm = (args, env) => {
    if (isWin) {
      // On this environment/Node version, spawning `npm.cmd` directly yields EINVAL.
      // Use `cmd.exe /d /s /c ...` instead (reliable on Windows).
      return spawn(comspec, ['/d', '/s', '/c', `npm ${args.join(' ')}`], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }
    return spawn('npm', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  };

  const backend = spawnNpm(['run', '--workspace=aletheia-backend', 'start:dev'], backendEnv);
  const frontend = spawnNpm(['run', '--workspace=aletheia-frontend', 'dev'], frontendEnv);

  prefixStream(backend, 'backend');
  prefixStream(frontend, 'frontend');

  const killAll = () => {
    removeStackPortsFile();
    try {
      backend.kill();
    } catch {}
    try {
      frontend.kill();
    } catch {}
  };
  process.on('SIGINT', () => {
    killAll();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    killAll();
    process.exit(143);
  });

  // If either exits, stop the other and exit non-zero (dev convenience).
  const exit = (label) => (code) => {
    if (typeof code === 'number' && code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
    killAll();
    process.exit(typeof code === 'number' ? code : 1);
  };
  backend.on('exit', exit('backend'));
  frontend.on('exit', exit('frontend'));
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});

