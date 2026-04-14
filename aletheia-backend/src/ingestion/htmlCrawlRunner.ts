import {
  EvidenceSourceKind,
  HtmlCrawlFetchStatus,
  HtmlCrawlFollowMode,
  HtmlCrawlRunStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { evidenceRawBodySha256Hex } from '@common/utils/evidence-raw-body-hash';

export type HtmlCrawlConfig = {
  crawlDepth: number;
  maxPages: number;
  allowedDomains: string[];
  includeQueryParams: boolean;
  followMode: HtmlCrawlFollowMode;
};

export type RunHtmlCrawlArgs = {
  seedUrl: string;
  config: HtmlCrawlConfig;
  createdByUserId: string;
  fetchImpl?: typeof fetch;
  startedAt?: Date;
};

export function findHtmlTagEnd(html: string, openAngleIndex: number): number {
  let i = openAngleIndex;
  let quote: '"' | "'" | null = null;
  while (i < html.length) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      i += 1;
      continue;
    }
    if (c === '>') return i;
    i += 1;
  }
  return -1;
}

export function extractAnchorHrefsInDocumentOrder(html: string): string[] {
  const lower = html.toLowerCase();
  const out: string[] = [];
  let pos = 0;
  while (pos < html.length) {
    const idx = lower.indexOf('<a', pos);
    if (idx === -1) break;
    const end = findHtmlTagEnd(html, idx);
    if (end === -1) break;
    const tagSlice = html.slice(idx, end + 1);
    const hrefMatch = tagSlice.match(
      /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
    );
    if (hrefMatch) {
      const raw =
        hrefMatch[2] !== undefined
          ? hrefMatch[2]
          : hrefMatch[3] !== undefined
            ? hrefMatch[3]
            : (hrefMatch[4] ?? '');
      if (raw.length > 0) out.push(raw);
    }
    pos = end + 1;
  }
  return out;
}

export function hostnameInAllowedList(
  hostname: string,
  allowedDomains: string[],
): boolean {
  const h = hostname.toLowerCase();
  for (const d of allowedDomains) {
    if (d.toLowerCase() === h) return true;
  }
  return false;
}

export function normalizeCrawlUrl(
  hrefRaw: string,
  baseUrl: URL,
  includeQueryParams: boolean,
): string | null {
  let resolved: URL;
  try {
    resolved = new URL(hrefRaw.trim(), baseUrl);
  } catch {
    return null;
  }
  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:')
    return null;

  let path = resolved.pathname || '/';
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  const search = includeQueryParams ? resolved.search : '';
  const origin = `${resolved.protocol}//${resolved.host}`;
  return `${origin}${path}${search}`;
}

export function stableLexicographicSort(urls: string[]): string[] {
  const copy = [...urls];
  for (let i = 0; i < copy.length; i++) {
    for (let j = i + 1; j < copy.length; j++) {
      if (
        copy[i].localeCompare(copy[j], 'en', { sensitivity: 'variant' }) > 0
      ) {
        const t = copy[i];
        copy[i] = copy[j];
        copy[j] = t;
      }
    }
  }
  return copy;
}

type QueueItem = { url: string; depth: number };

export async function runHtmlCrawlIngestion(
  prisma: PrismaClient | Prisma.TransactionClient,
  args: RunHtmlCrawlArgs,
): Promise<{ runId: string }> {
  const fetchFn = args.fetchImpl ?? fetch;
  const startedAt = args.startedAt ?? new Date();
  const { seedUrl, config, createdByUserId } = args;
  const errors: string[] = [];

  if (config.followMode !== HtmlCrawlFollowMode.STRICT_ONLY) {
    throw new Error('REQUIRES_ADR: unsupported followMode');
  }

  let seedParsed: URL;
  try {
    seedParsed = new URL(seedUrl);
  } catch {
    const run = await prisma.htmlCrawlIngestionRun.create({
      data: {
        createdByUserId,
        seedUrl,
        crawlDepth: config.crawlDepth,
        maxPages: config.maxPages,
        allowedDomains: config.allowedDomains,
        includeQueryParams: config.includeQueryParams,
        followMode: config.followMode,
        startedAt,
        finishedAt: new Date(),
        status: HtmlCrawlRunStatus.FAILED,
        errorLog: JSON.stringify(['Invalid seed URL']),
      },
    });
    return { runId: run.id };
  }

  const seedNorm = normalizeCrawlUrl(
    seedUrl,
    seedParsed,
    config.includeQueryParams,
  );
  if (
    !seedNorm ||
    !hostnameInAllowedList(new URL(seedNorm).hostname, config.allowedDomains)
  ) {
    const run = await prisma.htmlCrawlIngestionRun.create({
      data: {
        createdByUserId,
        seedUrl,
        crawlDepth: config.crawlDepth,
        maxPages: config.maxPages,
        allowedDomains: config.allowedDomains,
        includeQueryParams: config.includeQueryParams,
        followMode: config.followMode,
        startedAt,
        finishedAt: new Date(),
        status: HtmlCrawlRunStatus.FAILED,
        errorLog: JSON.stringify([
          'Seed URL not allowed or not normalizable as http(s)',
        ]),
      },
    });
    return { runId: run.id };
  }

  const run = await prisma.htmlCrawlIngestionRun.create({
    data: {
      createdByUserId,
      seedUrl: seedNorm,
      crawlDepth: config.crawlDepth,
      maxPages: config.maxPages,
      allowedDomains: config.allowedDomains,
      includeQueryParams: config.includeQueryParams,
      followMode: config.followMode,
      startedAt,
      finishedAt: null,
      status: HtmlCrawlRunStatus.PARTIAL,
      errorLog: null,
    },
  });

  const runId = run.id;
  const scheduled = new Set<string>([seedNorm]);
  const processed = new Set<string>();
  const queue: QueueItem[] = [{ url: seedNorm, depth: 0 }];

  let fetchAttempts = 0;
  let anyFailure = false;
  let anySuccess = false;

  while (queue.length > 0 && fetchAttempts < config.maxPages) {
    const item = queue.shift()!;
    if (processed.has(item.url)) continue;
    processed.add(item.url);

    if (item.depth > config.crawlDepth) continue;

    fetchAttempts += 1;

    let pageUrl: URL;
    try {
      pageUrl = new URL(item.url);
    } catch {
      anyFailure = true;
      await prisma.htmlCrawlIngestionRunEvidence.create({
        data: {
          runId,
          evidenceId: null,
          url: item.url,
          depth: item.depth,
          fetchStatus: HtmlCrawlFetchStatus.FAILED,
          errorMessage: 'URL parse error',
        },
      });
      errors.push(`parse_error:${item.url}`);
      continue;
    }

    let body: Buffer;
    try {
      const res = await fetchFn(item.url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'AletheiaHtmlCrawlIngestion/1.0' },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok) {
        anyFailure = true;
        await prisma.htmlCrawlIngestionRunEvidence.create({
          data: {
            runId,
            evidenceId: null,
            url: item.url,
            depth: item.depth,
            fetchStatus: HtmlCrawlFetchStatus.FAILED,
            errorMessage: `HTTP ${res.status}`,
          },
        });
        errors.push(`http_${res.status}:${item.url}`);
        continue;
      }
      body = buf;
    } catch (e) {
      anyFailure = true;
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.htmlCrawlIngestionRunEvidence.create({
        data: {
          runId,
          evidenceId: null,
          url: item.url,
          depth: item.depth,
          fetchStatus: HtmlCrawlFetchStatus.FAILED,
          errorMessage: msg,
        },
      });
      errors.push(`fetch:${item.url}:${msg}`);
      continue;
    }

    const contentSha256 = evidenceRawBodySha256Hex(body);
    const htmlStr = body.toString('latin1');
    const evidence = await prisma.evidence.create({
      data: {
        createdBy: createdByUserId,
        sourceType: EvidenceSourceKind.HTML_PAGE,
        sourceUrl: item.url,
        sourceDocumentId: null,
        chunkId: null,
        startOffset: null,
        endOffset: null,
        snippet: null,
        contentSha256,
        rawBody: new Uint8Array(body),
      },
    });

    anySuccess = true;

    await prisma.htmlCrawlIngestionRunEvidence.create({
      data: {
        runId,
        evidenceId: evidence.id,
        url: item.url,
        depth: item.depth,
        fetchStatus: HtmlCrawlFetchStatus.SUCCESS,
        errorMessage: null,
      },
    });

    if (item.depth < config.crawlDepth && fetchAttempts < config.maxPages) {
      const rawHrefs = extractAnchorHrefsInDocumentOrder(htmlStr);
      const normalized: string[] = [];
      for (const h of rawHrefs) {
        const n = normalizeCrawlUrl(h, pageUrl, config.includeQueryParams);
        if (!n) continue;
        let host: string;
        try {
          host = new URL(n).hostname;
        } catch {
          continue;
        }
        if (!hostnameInAllowedList(host, config.allowedDomains)) continue;
        normalized.push(n);
      }
      const sorted = stableLexicographicSort(normalized);
      for (const u of sorted) {
        if (!scheduled.has(u)) {
          scheduled.add(u);
          queue.push({ url: u, depth: item.depth + 1 });
        }
      }
    }
  }

  const status = !anySuccess
    ? HtmlCrawlRunStatus.FAILED
    : anyFailure
      ? HtmlCrawlRunStatus.PARTIAL
      : HtmlCrawlRunStatus.SUCCESS;

  await prisma.htmlCrawlIngestionRun.update({
    where: { id: runId },
    data: {
      finishedAt: new Date(),
      status,
      errorLog: errors.length ? JSON.stringify(errors) : null,
    },
  });

  return { runId };
}
