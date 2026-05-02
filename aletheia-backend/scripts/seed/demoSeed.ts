/**
 * CLI entry: deterministic demo database seed (investor walkthrough).
 *
 * Usage (from aletheia-backend):
 *   npm run db:seed:demo
 *   (loads `.env.demo`, or `.env.demo.example` if missing, then `.env`)
 *
 * Safety:
 * - Refuses to run unless DB name includes "demo" or equals "aletheia_test".
 */
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import {
  assertDemoDatabaseUrlNotPlaceholder,
  loadDemoEnvFiles,
} from '../db/loadDemoEnv';
import { runDemoSeed } from './demo-seed.lib';

function loadEnv(): void {
  loadDemoEnvFiles(resolve(process.cwd()));
  assertDemoDatabaseUrlNotPlaceholder();
}

function verifyDemoDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';
  const ok = dbName === 'aletheia_test' || dbName.toLowerCase().includes('demo');
  if (!ok) {
    throw new Error(
      `Refusing to run demo seed against "${dbName}". ` +
        `Set DATABASE_URL to a dedicated demo database (name must include "demo") ` +
        `or use aletheia_test.`,
    );
  }
}

async function main(): Promise<void> {
  loadEnv();
  verifyDemoDatabase();

  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl || datasourceUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required for demo seeding.');
  }

  const pool = new Pool({ connectionString: datasourceUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const { counts } = await runDemoSeed(prisma);
    console.log('\nDemo seed summary (counts only):');
    console.log(JSON.stringify(counts, null, 2));
    console.log('');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

