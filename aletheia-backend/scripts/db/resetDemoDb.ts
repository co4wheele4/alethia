/**
 * Drops the demo database schema, reapplies migrations, and runs the deterministic demo seed.
 * Usage (from aletheia-backend): npm run db:reset:demo
 *
 * Prisma may block `migrate reset` when invoked from an AI agent unless you set
 * `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` to your explicit consent string (see Prisma docs).
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { assertDemoDatabaseUrlNotPlaceholder, loadDemoEnvFiles } from './loadDemoEnv';

const backendRoot = resolve(__dirname, '..', '..');
process.chdir(backendRoot);

loadDemoEnvFiles(backendRoot);
assertDemoDatabaseUrlNotPlaceholder();

function verifyDemoDatabaseUrl(): void {
  const dbUrl = process.env.DATABASE_URL?.trim() || '';
  if (!dbUrl) {
    const demoPath = resolve(backendRoot, '.env.demo');
    const examplePath = resolve(backendRoot, '.env.demo.example');
    throw new Error(
      `DATABASE_URL is not set. Create ${demoPath} (copy from .env.demo.example) or ensure ` +
        `${existsSync(examplePath) ? examplePath : '.env.demo.example'} defines DATABASE_URL, ` +
        `or set DATABASE_URL in your environment / root .env.`,
    );
  }
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';
  const ok = dbName === 'aletheia_test' || dbName.toLowerCase().includes('demo');
  if (!ok) {
    throw new Error(
      `Refusing to reset database "${dbName}". ` +
        `DATABASE_URL must target a database whose name includes "demo" (or aletheia_test).`,
    );
  }
}

verifyDemoDatabaseUrl();

function runOrHint(command: string): void {
  try {
    execSync(command, { stdio: 'inherit', env: process.env });
  } catch {
    console.error(`
[db:reset:demo] Command failed: ${command}

If Prisma reported P1000 (authentication failed), your DATABASE_URL credentials are wrong.
Update aletheia-backend/.env.demo (create from .env.demo.example): use the same host/user/password
as your working Postgres (often matching .env.test), and ensure the database name includes "demo".
Create the database once if needed, e.g. CREATE DATABASE aletheia_demo;
`);
    process.exit(1);
  }
}

runOrHint('npx prisma migrate reset --force');
runOrHint('npx tsx scripts/seed/demoSeed.ts');
