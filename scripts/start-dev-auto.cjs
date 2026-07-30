/* eslint-disable no-console */
/**
 * Start backend + frontend dev servers on the first free ports.
 *
 * Port selection uses sibling `../port-utils` (dev-port-utils) so behavior matches
 * `nest-port.cjs` / `next-port.cjs` and avoids false frees on Windows (IPv4/IPv6).
 *
 * This avoids killing existing processes; instead we probe for free ports starting at:
 * - backend: 3000
 * - frontend: 3030
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const { firstFreePort } = require(path.join(__dirname, 'dev-port-utils.cjs'));
const { withSystemCa } = require(path.join(__dirname, 'demo-env.cjs'));

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

function printDevUrls(backendPort, frontendPort) {
  const b = backendPort;
  const f = frontendPort;
  console.log('');
  console.log('=== Aletheia dev (ports in use) ===');
  console.log(`Backend (Nest):     http://localhost:${b}/`);
  console.log(`                    http://127.0.0.1:${b}/`);
  console.log(`GraphQL:            http://localhost:${b}/graphql`);
  console.log(`                    http://127.0.0.1:${b}/graphql`);
  console.log(`OpenAPI / Swagger:  http://localhost:${b}/api`);
  console.log(`                    http://127.0.0.1:${b}/api`);
  console.log(`Health:             http://localhost:${b}/health`);
  console.log(`                    http://127.0.0.1:${b}/health`);
  console.log(`Frontend (Next.js): http://localhost:${f}/`);
  console.log(`                    http://127.0.0.1:${f}/`);
  console.log('===================================');
  console.log('');
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

  const aletheiaFrontendUrl = `http://localhost:${frontendPort}`;

  const processEnv = withSystemCa(process.env);

  const backendEnv = {
    ...processEnv,
    PORT: String(backendPort),
    ALLOWED_ORIGINS: allowedOrigins,
    ALETHEIA_FRONTEND_URL: aletheiaFrontendUrl,
  };

  const frontendEnv = {
    ...processEnv,
    PORT: String(frontendPort),
    NEXT_PUBLIC_GRAPHQL_URL: `http://127.0.0.1:${backendPort}/graphql`,
  };

  printDevUrls(backendPort, frontendPort);

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
