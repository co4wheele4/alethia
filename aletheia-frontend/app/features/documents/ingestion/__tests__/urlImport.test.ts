import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importUrlToText } from '../urlImport';

describe('urlImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import text from a URL', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      url: 'https://example.com/page',
      text: async () => 'hello world',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await importUrlToText('https://example.com');
    expect(result.text).toBe('hello world');
    expect(result.title).toBe('https://example.com');
    expect(result.fetchedUrl).toBe('https://example.com/page');
  });

  it('should handle fetch failure', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(importUrlToText('https://example.com')).rejects.toThrow('Failed to fetch URL (404)');
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
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      url: 'https://example.com/html',
      text: async () => html,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

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
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      url: 'https://example.com/simple',
      text: async () => html,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await importUrlToText('https://example.com/simple');
    expect(result.title).toBe('https://example.com/simple');
    expect(result.text).toBe('Simple content');
    expect(result.publisher).toBeNull();
    expect(result.author).toBeNull();
    expect(result.publishedAtIso).toBeNull();
  });

  it('should handle invalid date in metadata', async () => {
    const html = '<html><head><meta name="date" content="not-a-date" /></head><body>Content</body></html>';
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      url: 'https://example.com/bad-date',
      text: async () => html,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await importUrlToText('https://example.com/bad-date');
    expect(result.publishedAtIso).toBeNull();
  });

  it('should use time[datetime] if available', async () => {
    const html = '<html><body><time datetime="2023-02-02">Feb 2</time></body></html>';
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      url: 'https://example.com/time',
      text: async () => html,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await importUrlToText('https://example.com/time');
    expect(result.publishedAtIso).toBe('2023-02-02T00:00:00.000Z');
  });

  it('should handle missing doc.body in htmlToText', async () => {
    // DOMParser.parseFromString can return a document without a body in some environments or with invalid HTML
    // We mock DOMParser to return a doc with null body
    const mockDoc = {
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockReturnValue(null),
      body: null,
    };
    class MockParser {
      parseFromString = vi.fn().mockReturnValue(mockDoc);
    }
    vi.stubGlobal('DOMParser', MockParser);

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: () => Promise.resolve(''),
      url: 'http://example.com/no-body',
    } as any);

    const result = await importUrlToText('http://example.com/no-body');
    expect(result.text).toBe('');
    vi.unstubAllGlobals();
  });

  it('should handle missing res.url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'text',
      // res.url is missing
    }));

    const result = await importUrlToText('http://example.com/no-res-url');
    expect(result.fetchedUrl).toBe('http://example.com/no-res-url');
  });

  it('should handle null content-type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({}), // null content-type
      text: async () => 'plain text',
      url: 'http://example.com/null-ct',
    }));

    const result = await importUrlToText('http://example.com/null-ct');
    expect(result.contentType).toBeNull();
    expect(result.text).toBe('plain text');
  });
});
