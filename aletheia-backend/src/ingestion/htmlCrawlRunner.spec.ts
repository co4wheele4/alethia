import { createHash } from 'crypto';
import {
  EvidenceSourceKind,
  HtmlCrawlFollowMode,
  HtmlCrawlRunStatus,
} from '@prisma/client';
import {
  extractAnchorHrefsInDocumentOrder,
  hostnameInAllowedList,
  normalizeCrawlUrl,
  runHtmlCrawlIngestion,
  stableLexicographicSort,
} from './htmlCrawlRunner';

describe('htmlCrawlRunner helpers', () => {
  it('extractAnchorHrefsInDocumentOrder returns hrefs in document order', () => {
    const html =
      '<div><a href="/z">z</a><a href=\'/a\'>a</a><a href=/b>b</a></div>';
    expect(extractAnchorHrefsInDocumentOrder(html)).toEqual(['/z', '/a', '/b']);
  });

  it('stableLexicographicSort sorts URLs lexicographically', () => {
    expect(stableLexicographicSort(['https://b/x', 'https://a/x', 'https://a/y'])).toEqual([
      'https://a/x',
      'https://a/y',
      'https://b/x',
    ]);
  });

  it('normalizeCrawlUrl strips query when includeQueryParams=false', () => {
    const base = new URL('https://example.com/path');
    expect(normalizeCrawlUrl('/q?x=1', base, false)).toBe('https://example.com/q');
  });

  it('normalizeCrawlUrl keeps query when includeQueryParams=true', () => {
    const base = new URL('https://example.com/path');
    expect(normalizeCrawlUrl('/q?x=1', base, true)).toBe('https://example.com/q?x=1');
  });

  it('hostnameInAllowedList is exact hostname match', () => {
    expect(hostnameInAllowedList('example.com', ['example.com'])).toBe(true);
    expect(hostnameInAllowedList('evil.com', ['example.com'])).toBe(false);
  });
});

describe('runHtmlCrawlIngestion', () => {
  function mockFetch(
    pages: Record<string, { body: string; ok?: boolean; status?: number }>,
  ): typeof fetch {
    return (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const p = pages[url];
      if (!p) {
        return new Response('not found', { status: 404 });
      }
      const status = p.status ?? (p.ok === false ? 500 : 200);
      return new Response(p.body, { status });
    }) as typeof fetch;
  }

  function createMockPrisma() {
    const runRows: Record<string, unknown> = {};
    const evidenceRows: unknown[] = [];
    const linkRows: unknown[] = [];

    const prisma = {
      htmlCrawlIngestionRun: {
        create: jest.fn(async ({ data }: { data: { id?: string } & Record<string, unknown> }) => {
          const id = data.id ?? 'run-1';
          runRows[id] = { ...data, id };
          return runRows[id];
        }),
        update: jest.fn(async ({ where, data }: { where: { id: string }; data: object }) => {
          const prev = (runRows[where.id] ?? {}) as Record<string, unknown>;
          runRows[where.id] = { ...prev, ...data };
          return runRows[where.id];
        }),
      },
      htmlCrawlIngestionRunEvidence: {
        create: jest.fn(async ({ data }: { data: unknown }) => {
          linkRows.push(data);
          return data;
        }),
      },
      evidence: {
        create: jest.fn(async ({ data }: { data: { id?: string } & Record<string, unknown> }) => {
          const id = data.id ?? `ev-${evidenceRows.length + 1}`;
          const row = { ...data, id };
          evidenceRows.push(row);
          return row;
        }),
      },
    };
    return { prisma, runRows, evidenceRows, linkRows };
  }

  it('respects maxPages', async () => {
    const { prisma, evidenceRows } = createMockPrisma();
    const htmlA =
      '<html><a href="https://example.com/b">b</a><a href="https://example.com/c">c</a></html>';
    const fetchImpl = mockFetch({
      'https://example.com/a': { body: htmlA },
      'https://example.com/b': { body: '<html></html>' },
      'https://example.com/c': { body: '<html></html>' },
    });

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/a',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 2,
        maxPages: 2,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    expect(evidenceRows).toHaveLength(2);
  });

  it('respects crawlDepth (no fetch when depth exceeds limit)', async () => {
    const { prisma, evidenceRows } = createMockPrisma();
    const html =
      '<html><a href="https://example.com/child">c</a></html>';
    const fetchImpl = mockFetch({
      'https://example.com/root': { body: html },
      'https://example.com/child': { body: '<html></html>' },
    });

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/root',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 0,
        maxPages: 10,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    expect(evidenceRows).toHaveLength(1);
    expect((evidenceRows[0] as { sourceUrl?: string }).sourceUrl).toBe(
      'https://example.com/root',
    );
  });

  it('enqueues discovered links in lexicographic order (BFS)', async () => {
    const { prisma, evidenceRows } = createMockPrisma();
    const html =
      '<html><a href="https://example.com/z">z</a><a href="https://example.com/m">m</a></html>';
    const fetchImpl = mockFetch({
      'https://example.com/root': { body: html },
      'https://example.com/m': { body: '<html></html>' },
      'https://example.com/z': { body: '<html></html>' },
    });

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/root',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 1,
        maxPages: 10,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    expect(evidenceRows).toHaveLength(3);
    const urls = evidenceRows.map((e) => (e as { sourceUrl: string }).sourceUrl);
    expect(urls[0]).toBe('https://example.com/root');
    expect(urls[1]).toBe('https://example.com/m');
    expect(urls[2]).toBe('https://example.com/z');
  });

  it('skips hosts not in allowedDomains', async () => {
    const { prisma, evidenceRows } = createMockPrisma();
    const html =
      '<html><a href="https://other.com/x">x</a><a href="https://example.com/y">y</a></html>';
    const fetchImpl = mockFetch({
      'https://example.com/a': { body: html },
      'https://example.com/y': { body: '<html></html>' },
    });

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/a',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 1,
        maxPages: 10,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    expect(evidenceRows.map((e) => (e as { sourceUrl: string }).sourceUrl)).toEqual([
      'https://example.com/a',
      'https://example.com/y',
    ]);
  });

  it('stores contentSha256 matching raw body bytes', async () => {
    const { prisma, evidenceRows } = createMockPrisma();
    const bodyStr = '<html><body>hi</body></html>';
    const buf = Buffer.from(bodyStr, 'latin1');
    const fetchImpl = mockFetch({
      'https://example.com/a': { body: bodyStr },
    });

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/a',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 0,
        maxPages: 5,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    const ev = evidenceRows[0] as {
      contentSha256: string;
      rawBody: Uint8Array;
      sourceType: string;
    };
    expect(ev.sourceType).toBe(EvidenceSourceKind.HTML_PAGE);
    expect(ev.contentSha256).toBe(createHash('sha256').update(buf).digest('hex'));
    expect(Buffer.from(ev.rawBody).equals(buf)).toBe(true);
  });

  it('records FAILED run when seed host not allowed', async () => {
    const { prisma } = createMockPrisma();
    const fetchImpl = mockFetch({});

    await runHtmlCrawlIngestion(prisma as never, {
      seedUrl: 'https://example.com/a',
      createdByUserId: 'user-1',
      fetchImpl,
      config: {
        crawlDepth: 0,
        maxPages: 5,
        allowedDomains: ['other.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    expect(prisma.htmlCrawlIngestionRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: HtmlCrawlRunStatus.FAILED,
        }),
      }),
    );
  });

  it('throws REQUIRES_ADR when followMode is not STRICT_ONLY', async () => {
    const { prisma } = createMockPrisma();
    await expect(
      runHtmlCrawlIngestion(prisma as never, {
        seedUrl: 'https://example.com/a',
        createdByUserId: 'u',
        config: {
          crawlDepth: 0,
          maxPages: 1,
          allowedDomains: ['example.com'],
          includeQueryParams: false,
          followMode: 'OTHER_MODE' as HtmlCrawlFollowMode,
        },
      }),
    ).rejects.toThrow(/REQUIRES_ADR/);
  });
});
