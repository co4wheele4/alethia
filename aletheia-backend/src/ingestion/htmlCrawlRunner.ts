import {
  EvidenceSourceKind,
  HtmlCrawlFetchStatus,
  HtmlCrawlFollowMode,
  HtmlCrawlRunStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { evidenceRawBodySha256Hex } from '@common/utils/evidence-raw-body-hash';
import { createHash } from 'crypto';

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

/**
 * Some sites embed client-side template fragments inside `href` attributes (Handlebars-like
 * concatenation). Those resolve to syntactically valid URLs but always 404 and pollute crawls.
 */
export function looksLikeBrokenClientTemplateUrl(url: string): boolean {
  const u = url;
  if (u.includes("'+") || u.includes("'+\"")) return true;
  if (u.includes('escapeExpression')) return true;
  if (u.includes('typeof(')) return true;
  if (u.includes('&quot;')) return true;
  if (u.includes('/$1') || u.endsWith('/$1')) return true;
  if (u.includes('null!=')) return true;
  return false;
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

function decodeHtmlEntitiesBasic(s: string): string {
  // Minimal deterministic decoding; avoids adding heavy HTML parser deps.
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(String(hex), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

function extractTitleFromHtml(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const raw = decodeHtmlEntitiesBasic(m[1] ?? '').trim();
  return raw.length ? raw : null;
}

function htmlToDeterministicText(html: string): string {
  // Mechanical extraction only (ADR-032): strip non-content tags then flatten.
  let s = html;
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  // Newline-ish structure before tag stripping.
  s = s.replace(/<(br|hr)\b[^>]*>/gi, '\n');
  s = s.replace(/<\/(p|div|section|article|header|footer|li|h[1-6]|tr)>/gi, '\n');
  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeHtmlEntitiesBasic(s);
  // Collapse whitespace deterministically.
  s = s.replace(/[ \t\r]+/g, ' ');
  s = s.replace(/\n[ \t]+/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function sha256HexUtf8(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

async function ingestHtmlPageAsDocument(
  prisma: PrismaClient | Prisma.TransactionClient,
  args: {
    createdByUserId: string;
    url: string;
    html: string;
    accessedAt: Date;
  },
): Promise<void> {
  const title = extractTitleFromHtml(args.html) ?? args.url;
  const content = htmlToDeterministicText(args.html);
  if (!content) return;

  const contentSha256 = sha256HexUtf8(content);

  const existingSource = await prisma.documentSource.findFirst({
    where: {
      contentSha256,
      document: {
        userId: args.createdByUserId,
        title,
      },
    },
    select: { documentId: true },
  });
  if (existingSource) return;

  const p = prisma as PrismaClient;
  if (typeof (p as { $transaction?: unknown }).$transaction !== 'function') return;

  await p.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        title,
        userId: args.createdByUserId,
        sourceType: 'URL',
        sourceLabel: args.url,
      },
      select: { id: true },
    });

    await tx.documentSource.create({
      data: {
        documentId: document.id,
        kind: 'URL',
        ingestedAt: new Date(),
        contentSha256,
        requestedUrl: args.url,
        fetchedUrl: args.url,
        contentType: 'text/html; charset=utf-8',
        accessedAt: args.accessedAt,
      },
    });

    // Mirror `IngestionService` paragraph chunking: split on blank lines.
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length) {
      await tx.documentChunk.createMany({
        data: paragraphs.map((p, idx) => ({
          documentId: document.id,
          chunkIndex: idx,
          content: p,
        })),
      });
    }
  });
}

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
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 AletheiaHtmlCrawlIngestion/1.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
        },
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
    const htmlStr = body.toString('utf8');
    // De-dupe identical HTML_PAGE evidence so multiple users/runs can cite the same immutable snapshot.
    // (Reusability is an ADR-019 invariant for Evidence; crawl runs are audit records that link to Evidence.)
    const existingEvidence =
      item.url && contentSha256
        ? await prisma.evidence.findFirst({
            where: {
              sourceType: EvidenceSourceKind.HTML_PAGE,
              sourceUrl: item.url,
              contentSha256,
            },
            select: { id: true },
          })
        : null;

    const evidence = existingEvidence
      ? await prisma.evidence.findUniqueOrThrow({
          where: { id: existingEvidence.id },
        })
      : await prisma.evidence.create({
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

    // Also ingest a deterministic text snapshot as a Document (so the rest of the system can chunk / browse it
    // using the same mechanics as file/URL ingestion). This does not extract entities; it only creates
    // Document + chunks from visible text.
    try {
      await ingestHtmlPageAsDocument(prisma, {
        createdByUserId,
        url: item.url,
        html: htmlStr,
        accessedAt: new Date(),
      });
    } catch (e) {
      // Never fail the crawl run for document extraction issues; record a mechanical error.
      const msg = e instanceof Error ? e.message : String(e);
      anyFailure = true;
      errors.push(`doc_ingest:${item.url}:${msg}`);
    }

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
        if (looksLikeBrokenClientTemplateUrl(n)) continue;
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
