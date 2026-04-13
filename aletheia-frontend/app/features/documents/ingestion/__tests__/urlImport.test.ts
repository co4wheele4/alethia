import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importUrlToText } from '../urlImport';

/** Mocks `/api/import-url` JSON contract used by `importUrlToText`. */
function mockProxyResponse(payload: {
  ok?: boolean;
  status?: number;
  body: Record<string, unknown>;
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: payload.ok ?? true,
      status: payload.status ?? 200,
      json: async () => payload.body,
    })
  );
}

describe('urlImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports Google News search URL; fetchedUrl reflects one redirect level', async () => {
    const requestedUrl =
      'https://www.google.com/search?q=news&rlz=1C1GCEA_enUS1209US1209&oq=news';
    // Simulates /api/import-url after one HTTP redirect (e.g. canonicalization); "one level deep" = single hop.
    const fetchedAfterRedirect = `${requestedUrl}&sei=simulated`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>news - Google Search</title>
</head>
<body>
  <div id="search">Top stories</div>
</body>
</html>`;

    mockProxyResponse({
      body: {
        raw: html,
        contentType: 'text/html; charset=UTF-8',
        fetchedUrl: fetchedAfterRedirect,
      },
    });

    const result = await importUrlToText(requestedUrl);

    expect(fetch).toHaveBeenCalledTimes(1);
    const proxyArg = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(proxyArg).toContain(encodeURIComponent('https://www.google.com/search?'));
    expect(proxyArg).toContain(encodeURIComponent('q=news'));

    expect(result.fetchedUrl).toBe(fetchedAfterRedirect);
    expect(result.title).toBe('news - Google Search');
    expect(result.text).toContain('Top stories');
  });

  it('should import text from a URL', async () => {
    mockProxyResponse({
      body: {
        raw: 'hello world',
        contentType: 'text/plain',
        fetchedUrl: 'https://example.com/page',
      },
    });

    const result = await importUrlToText('https://example.com');
    expect(result.text).toBe('hello world');
    expect(result.title).toBe('https://example.com');
    expect(result.fetchedUrl).toBe('https://example.com/page');
  });

  it('should handle fetch failure', async () => {
    mockProxyResponse({
      ok: false,
      status: 502,
      body: { error: 'Upstream returned 404' },
    });

    await expect(importUrlToText('https://example.com')).rejects.toThrow('Upstream returned 404');
  });

  it('should import and parse HTML from a URL', async () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta property="og:site_name" content="ACME News" />
          <meta name="author" content="Jane Doe" />
          <meta name="pubdate" content="2023-01-01" />
        </head>
        <body>
          <style>.hide { display: none; }</style>
          <script>console.log('hi')</script>
          <article>
            <h1>Article Title</h1>
            <p>Article body content.</p>
          </article>
        </body>
      </html>
    `;
    mockProxyResponse({
      body: {
        raw: html,
        contentType: 'text/html',
        fetchedUrl: 'https://example.com/html',
      },
    });

    const result = await importUrlToText('https://example.com/html');
    expect(result.title).toBe('Test Page');
    expect(result.text).toContain('Article Title');
    expect(result.text).toContain('Article body content.');
    expect(result.text).not.toContain('console.log');
    expect(result.publisher).toBe('ACME News');
    expect(result.author).toBe('Jane Doe');
    expect(result.publishedAtIso).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle missing metadata in HTML', async () => {
    const html = '<html><body>Simple content</body></html>';
    mockProxyResponse({
      body: {
        raw: html,
        contentType: 'text/html',
        fetchedUrl: 'https://example.com/simple',
      },
    });

    const result = await importUrlToText('https://example.com/simple');
    expect(result.title).toBe('https://example.com/simple');
    expect(result.text).toBe('Simple content');
    expect(result.publisher).toBeNull();
    expect(result.author).toBeNull();
    expect(result.publishedAtIso).toBeNull();
  });

  it('should handle invalid date in metadata', async () => {
    const html = '<html><head><meta name="date" content="not-a-date" /></head><body>Content</body></html>';
    mockProxyResponse({
      body: {
        raw: html,
        contentType: 'text/html',
        fetchedUrl: 'https://example.com/bad-date',
      },
    });

    const result = await importUrlToText('https://example.com/bad-date');
    expect(result.publishedAtIso).toBeNull();
  });

  it('should use time[datetime] if available', async () => {
    const html = '<html><body><time datetime="2023-02-02">Feb 2</time></body></html>';
    mockProxyResponse({
      body: {
        raw: html,
        contentType: 'text/html',
        fetchedUrl: 'https://example.com/time',
      },
    });

    const result = await importUrlToText('https://example.com/time');
    expect(result.publishedAtIso).toBe('2023-02-02T00:00:00.000Z');
  });

  it('should handle missing doc.body in htmlToText', async () => {
    const mockDoc = {
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockReturnValue(null),
      body: null,
    };
    class MockParser {
      parseFromString = vi.fn().mockReturnValue(mockDoc);
    }
    vi.stubGlobal('DOMParser', MockParser);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          raw: '',
          contentType: 'text/html',
          fetchedUrl: 'http://example.com/no-body',
        }),
      })
    );

    const result = await importUrlToText('http://example.com/no-body');
    expect(result.text).toBe('');
    vi.unstubAllGlobals();
  });

  it('should handle missing fetchedUrl in proxy payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          raw: 'text',
          contentType: 'text/plain',
        }),
      })
    );

    const result = await importUrlToText('http://example.com/no-res-url');
    expect(result.fetchedUrl).toBe('http://example.com/no-res-url');
  });

  it('should handle null content-type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          raw: 'plain text',
          contentType: null,
          fetchedUrl: 'http://example.com/null-ct',
        }),
      })
    );

    const result = await importUrlToText('http://example.com/null-ct');
    expect(result.contentType).toBeNull();
    expect(result.text).toBe('plain text');
  });
});
