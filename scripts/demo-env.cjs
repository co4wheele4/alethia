/* eslint-disable no-console */
/**
 * Shared helpers for `npm run demo` and headed Playwright walkthrough.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function parseDotenvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Ensure Node uses the OS trust store (corporate / locally installed root CAs).
 * Avoids `unable to verify the first certificate` on HTTPS fetches (e.g. demo URL import).
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {NodeJS.ProcessEnv}
 */
function withSystemCa(env = process.env) {
  const flag = '--use-system-ca';
  const existing = String(env.NODE_OPTIONS || '').trim();
  const parts = existing ? existing.split(/\s+/).filter(Boolean) : [];
  if (parts.includes(flag)) {
    return { ...env };
  }
  return {
    ...env,
    NODE_OPTIONS: parts.length ? `${parts.join(' ')} ${flag}` : flag,
  };
}

/**
 * After seeding, align dev servers with `aletheia-backend/.env.test` so API hits the same DB as `db:seed:test`.
 * @param {boolean} seed
 * @returns {NodeJS.ProcessEnv}
 */
function getChildEnvAfterSeed(seed) {
  const base = withSystemCa(process.env);
  if (!seed) return base;
  const envTestPath = path.join(root, 'aletheia-backend', '.env.test');
  const envTest = parseDotenvFile(envTestPath);
  if (envTest.DATABASE_URL) {
    console.log(
      '[demo] Dev servers use DATABASE_URL from aletheia-backend/.env.test (same database as db:seed:test).',
    );
    return { ...base, DATABASE_URL: envTest.DATABASE_URL };
  }
  console.warn(
    '[demo] aletheia-backend/.env.test has no DATABASE_URL; backend may use a different DB than the seed.',
  );
  return base;
}

module.exports = {
  root,
  parseDotenvFile,
  withSystemCa,
  getChildEnvAfterSeed,
};
