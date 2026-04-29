/**
 * Picks a free TCP port for Playwright <-> Next.js to agree on, without async Playwright config.
 *
 * NOTE: `playwright.config.ts` is loaded in a way that is easiest to keep synchronous; doing the
 * bind probe in a tiny child process avoids blocking the main thread event loop.
 */
const net = require('node:net');

function getEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen({ port: 0, host: '127.0.0.1' }, () => {
      const addr = server.address();
      try {
        server.close();
      } catch {
        // ignore
      }
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to read ephemeral port'));
        return;
      }
      resolve(addr.port);
    });
  });
}

void (async () => {
  try {
    if (process.env.PLAYWRIGHT_TEST_BASE_URL) {
      // Respect explicit user configuration; do not auto-pick.
      process.stdout.write(String(new URL(process.env.PLAYWRIGHT_TEST_BASE_URL).port || ''));
      return;
    }

    const fromEnv = process.env.PLAYWRIGHT_TEST_PORT
      ? Number.parseInt(process.env.PLAYWRIGHT_TEST_PORT, 10)
      : Number.NaN;
    const preferred = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3040;

    // If we can bind the preferred port in this process, we keep it stable for local workflows.
    const preferredServer = net.createServer();
    const canUsePreferred = await new Promise((resolve) => {
      const done = (ok) => {
        try {
          preferredServer.close();
        } catch {
          // ignore
        }
        resolve(ok);
      };
      preferredServer.once('error', () => done(false));
      preferredServer.listen({ port: preferred, host: '127.0.0.1' }, () => done(true));
    });

    if (canUsePreferred) {
      process.stdout.write(String(preferred));
      return;
    }

    const p = await getEphemeralPort();
    process.stdout.write(String(p));
  } catch (e) {
    process.stderr.write(String(e?.stack || e) + '\n');
    process.exitCode = 1;
  }
})();
