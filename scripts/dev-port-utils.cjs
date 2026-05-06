/* eslint-disable no-console */
/**
 * Prefer sibling `../port-utils` (same algorithm as `dev-port-utils` under C:\dev\port-utils).
 * If that checkout is missing (e.g. CI clone of only this repo), use an identical inline
 * implementation so port scripts keep working.
 */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');

const portUtilsMain = path.join(__dirname, '..', '..', 'port-utils', 'index.cjs');

if (fs.existsSync(portUtilsMain)) {
  module.exports = require(portUtilsMain);
} else {
  console.warn(
    `[alethia] dev-port-utils: sibling not found at ${portUtilsMain}; using bundled port helpers (same behavior).`,
  );

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

  async function firstFreePort(startPort, opts = {}) {
    const { maxTries = 50 } = opts;
    for (let p = startPort, i = 0; i < maxTries; i += 1, p += 1) {
      // eslint-disable-next-line no-await-in-loop
      const free = await isPortFree(p);
      if (free) return p;
    }
    throw new Error(`No free port found in range [${startPort}, ${startPort + maxTries - 1}]`);
  }

  module.exports = {
    canBind,
    isPortFree,
    firstFreePort,
  };
}
