import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { wipeAllTables } from '../scripts/seed/test-seed.lib';

function getDbName(dbUrl: string): string {
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'unknown';
}

export default async function globalSetup(): Promise<void> {
  // Ensure env is loaded for CI/local e2e.
  const envTestPath = resolve(process.cwd(), '.env.test');
  try {
    config({ path: envTestPath });
  } catch {
    config();
  }

  // Force test database selection.
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  } else if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('/aletheia_test')
  ) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      /\/([^/?]+)(\?|$)/,
      '/aletheia_test$2',
    );
  }

  const dbUrl = process.env.DATABASE_URL || '';
  const dbName = getDbName(dbUrl);
  if (dbName !== 'aletheia_test') {
    throw new Error(
      `Refusing to run e2e global setup against "${dbName}". ` +
        `Configure DATABASE_URL/TEST_DATABASE_URL to point to a dedicated aletheia_test database.`,
    );
  }

  // Keep e2e deterministic and isolated without destructive migrations.
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });

  // The e2e suite seeds per-test; globalSetup should ensure a clean slate only.
  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl || datasourceUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required for e2e global setup.');
  }

  const pool = new Pool({ connectionString: datasourceUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    await wipeAllTables(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
