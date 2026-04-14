/**
 * CLI entry: deterministic full test database seed.
 * Usage (from aletheia-backend): npm run db:seed:test
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { runTestSeed } from './test-seed.lib';

function loadEnv(): void {
  const envTestPath = resolve(process.cwd(), '.env.test');
  config({ path: envTestPath });
  config();
}

function verifyTestDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : 'unknown';
  if (dbName !== 'aletheia_test') {
    throw new Error(
      `Refusing to run test seed against "${dbName}". ` +
        `Set DATABASE_URL to a dedicated aletheia_test database (see docs/dev/test-seed.md).`,
    );
  }
}

async function main(): Promise<void> {
  loadEnv();
  verifyTestDatabase();

  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl || datasourceUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required for test seeding.');
  }

  const pool = new Pool({ connectionString: datasourceUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const { counts } = await runTestSeed(prisma);
    console.log('\nTest seed summary (counts only):');
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
