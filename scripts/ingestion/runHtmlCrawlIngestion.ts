/**
 * ADR-032: Deterministic HTML crawl ingestion (CLI).
 *
 * Usage (repo root):
 *   npx tsx scripts/ingestion/runHtmlCrawlIngestion.ts --seedUrl https://example.com/ --depth 1 --maxPages 10 --domains example.com,www.example.com --userId <uuid>
 *
 * Requires DATABASE_URL and a valid user id (created_by on the run and evidence rows).
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../aletheia-backend/src/app/app.module';
import { HtmlCrawlIngestionService } from '../../aletheia-backend/src/ingestion/html-crawl-ingestion.service';

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function parseFlag(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  process.env.NODE_ENV ||= 'development';
  process.env.OPENAI_DISABLE_NETWORK ||= 'true';

  const seedUrl = parseFlag('seedUrl') ?? parseArg('seedUrl');
  const depthRaw = parseFlag('depth') ?? parseArg('depth');
  const maxPagesRaw = parseFlag('maxPages') ?? parseArg('maxPages');
  const domainsRaw = parseFlag('domains') ?? parseArg('domains');
  const includeQueryRaw =
    parseFlag('includeQueryParams') ?? parseArg('includeQueryParams');
  const userId = parseFlag('userId') ?? parseArg('userId');

  if (!seedUrl || !userId) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: npx tsx scripts/ingestion/runHtmlCrawlIngestion.ts --seedUrl <url> --depth <n> --maxPages <n> --domains a.com,b.com --userId <uuid> [--includeQueryParams true|false]',
    );
    process.exit(1);
  }

  const crawlDepth = Number(depthRaw ?? '0');
  const maxPages = Number(maxPagesRaw ?? '1');
  const allowedDomains = (domainsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const includeQueryParams =
    includeQueryRaw === undefined
      ? false
      : includeQueryRaw === 'true' || includeQueryRaw === '1';

  if (!Number.isFinite(crawlDepth) || crawlDepth < 0) {
    // eslint-disable-next-line no-console
    console.error('Invalid --depth');
    process.exit(1);
  }
  if (!Number.isFinite(maxPages) || maxPages < 1) {
    // eslint-disable-next-line no-console
    console.error('Invalid --maxPages');
    process.exit(1);
  }
  if (allowedDomains.length === 0) {
    // eslint-disable-next-line no-console
    console.error('Provide at least one --domains entry');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const svc = app.get(HtmlCrawlIngestionService);

  const run = await svc.createRun(
    {
      seedUrl,
      config: {
        crawlDepth,
        maxPages,
        allowedDomains,
        includeQueryParams,
        followMode: 'STRICT_ONLY',
      },
    },
    userId,
  );

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      { id: run.id, status: run.status, seedUrl: run.seedUrl, finishedAt: run.finishedAt },
      null,
      2,
    ),
  );
  await app.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
