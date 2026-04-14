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
 * After seeding, align dev servers with `aletheia-backend/.env.test` so API hits the same DB as `db:seed:test`.
 * @param {boolean} seed
 * @returns {NodeJS.ProcessEnv}
 */
function getChildEnvAfterSeed(seed) {
  if (!seed) return process.env;
  const envTestPath = path.join(root, 'aletheia-backend', '.env.test');
  const envTest = parseDotenvFile(envTestPath);
  if (envTest.DATABASE_URL) {
    console.log(
      '[demo] Dev servers use DATABASE_URL from aletheia-backend/.env.test (same database as db:seed:test).',
    );
    return { ...process.env, DATABASE_URL: envTest.DATABASE_URL };
  }
  console.warn(
    '[demo] aletheia-backend/.env.test has no DATABASE_URL; backend may use a different DB than the seed.',
  );
  return process.env;
}

module.exports = {
  root,
  parseDotenvFile,
  getChildEnvAfterSeed,
};
