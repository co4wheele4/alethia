/**
 * Demo tooling env:
 * - `.env.demo` if present (full override).
 * - Else `.env.test` DATABASE_URL with database name rewritten to `aletheia_demo` (same Postgres user/password as tests).
 * - Else `.env.demo.example`.
 * Then merge root `.env` via `config()`.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { config, parse } from 'dotenv';

/** Replace path segment after host (database name) in a postgres-style URL. */
function rewritePostgresDatabaseName(url: string, dbName: string): string {
  return url.replace(/\/([^/?]+)(\?|$)/, `/${dbName}$2`);
}

/**
 * Use test DB credentials against `aletheia_demo` so demo works without maintaining a second password.
 */
function applyDatabaseUrlFromTestEnv(backendRoot: string): boolean {
  const testPath = resolve(backendRoot, '.env.test');
  if (!existsSync(testPath)) return false;
  let parsed: Record<string, string>;
  try {
    parsed = parse(readFileSync(testPath, 'utf8'));
  } catch {
    return false;
  }
  const raw = parsed.DATABASE_URL?.trim();
  if (!raw) return false;
  process.env.DATABASE_URL = rewritePostgresDatabaseName(raw, 'aletheia_demo');
  return true;
}

export function loadDemoEnvFiles(backendRoot: string): void {
  const demoPath = resolve(backendRoot, '.env.demo');
  const examplePath = resolve(backendRoot, '.env.demo.example');

  if (existsSync(demoPath)) {
    config({ path: demoPath });
  } else if (applyDatabaseUrlFromTestEnv(backendRoot)) {
    if (existsSync(examplePath)) {
      config({ path: examplePath, override: false });
    }
  } else if (existsSync(examplePath)) {
    config({ path: examplePath });
  }
  config();
}

/**
 * Fail fast if someone still has template literals in DATABASE_URL (Prisma only reports P1000).
 */
export function assertDemoDatabaseUrlNotPlaceholder(): void {
  const url = process.env.DATABASE_URL?.trim() || '';
  if (!url) return;
  if (/\bYOUR_USER\b/i.test(url) || /\bYOUR_PASSWORD\b/i.test(url)) {
    throw new Error(
      `DATABASE_URL still contains YOUR_USER or YOUR_PASSWORD. Those are not real credentials.\n` +
        `Create aletheia-backend/.env.demo: copy .env.demo.example, then set DATABASE_URL to match ` +
        `your Postgres (often the same user/password as .env.test, database name e.g. aletheia_demo).`,
    );
  }
}
