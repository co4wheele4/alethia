/**
 * CLI: run `runHtmlCrawlIngestion` against a seed URL (default CNN homepage).
 *
 * Usage (from aletheia-backend, with Postgres + migrations + a user row):
 *   npx dotenv-cli -e .env.test -- npm run html-crawl:run
 *   npx dotenv-cli -e .env.test -- npm run html-crawl:run -- https://edition.cnn.com/
 *
 * Env:
 *   DATABASE_URL        — required (e.g. aletheia_test)
 *   HTML_CRAWL_USER_ID  — optional; default: first user with email seed-admin@aletheia.test, else first user in DB
 *   CRAWL_DEPTH         — optional, default 1
 *   MAX_PAGES           — optional, default 15
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { HtmlCrawlFollowMode, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { runHtmlCrawlIngestion } from '../src/ingestion/htmlCrawlRunner';

const CNN_RELATED_HOSTS = [
  'www.cnn.com',
  'cnn.com',
  'edition.cnn.com',
  'amp.cnn.com',
  'money.cnn.com',
  'us.cnn.com',
];

function loadEnv(): void {
  config({ path: resolve(process.cwd(), '.env.test') });
  config({ path: resolve(process.cwd(), '.env') });
}

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v?.trim()) return fallback;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

async function main(): Promise<void> {
  loadEnv();
  const datasourceUrl = process.env.DATABASE_URL?.trim();
  if (!datasourceUrl) {
    throw new Error('DATABASE_URL is required (load .env.test or .env).');
  }

  const seedUrl = process.argv[2]?.trim() || 'https://www.cnn.com/';
  const crawlDepth = intEnv('CRAWL_DEPTH', 1);
  const maxPages = intEnv('MAX_PAGES', 15);

  const pool = new Pool({ connectionString: datasourceUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let userId = process.env.HTML_CRAWL_USER_ID?.trim() || '';
    if (!userId) {
      const seeded = await prisma.user.findFirst({
        where: { email: 'seed-admin@aletheia.test' },
        select: { id: true },
      });
      const anyUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      userId = seeded?.id ?? anyUser?.id ?? '';
    }
    if (!userId) {
      throw new Error(
        'No user found. Seed the DB (e.g. npm run db:seed:test) or set HTML_CRAWL_USER_ID.',
      );
    }

    console.log(
      JSON.stringify(
        {
          seedUrl,
          userId,
          crawlDepth,
          maxPages,
          allowedDomains: CNN_RELATED_HOSTS,
          followMode: 'STRICT_ONLY',
        },
        null,
        2,
      ),
    );

    const { runId } = await runHtmlCrawlIngestion(prisma, {
      seedUrl,
      createdByUserId: userId,
      config: {
        crawlDepth,
        maxPages,
        allowedDomains: [...CNN_RELATED_HOSTS],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    const run = await prisma.htmlCrawlIngestionRun.findUniqueOrThrow({
      where: { id: runId },
      include: {
        evidenceRows: {
          orderBy: [{ depth: 'asc' }, { url: 'asc' }],
          select: {
            url: true,
            depth: true,
            fetchStatus: true,
            errorMessage: true,
            evidenceId: true,
          },
        },
      },
    });

    console.log(
      '\nDone. Run summary:\n' +
        JSON.stringify(
          {
            runId: run.id,
            status: run.status,
            seedUrl: run.seedUrl,
            finishedAt: run.finishedAt,
            errorLog: run.errorLog,
            evidenceRows: run.evidenceRows.length,
            rows: run.evidenceRows,
          },
          null,
          2,
        ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
