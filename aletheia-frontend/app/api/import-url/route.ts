import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

/** Public-domain placeholder HTML (example.com) for demos when TLS/proxy blocks server-side fetch. */
const EXAMPLE_COM_FALLBACK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Example Domain</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <div>
    <h1>Example Domain</h1>
    <p>This domain is for use in documentation examples without needing permission. Avoid use in operations.</p>
    <p><a href="https://www.iana.org/domains/example">Learn more</a></p>
  </div>
</body>
</html>
`;

function allowExampleComDemoFallback(): boolean {
  const v = process.env.URL_IMPORT_DEMO_FALLBACK;
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

function isExampleComRootUrl(u: URL): boolean {
  return u.hostname.toLowerCase() === 'example.com' && (u.pathname === '/' || u.pathname === '');
}

function jsonFromExampleComFallback(fetchedUrl: string) {
  return {
    raw: EXAMPLE_COM_FALLBACK_HTML,
    contentType: 'text/html; charset=utf-8',
    fetchedUrl,
  };
}

function assertSafePublicHttpUrl(urlString: string): URL {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.endsWith('.localhost')
  ) {
    throw new Error('This host is not allowed');
  }
  return u;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam?.trim()) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
  }

  let target: URL;
  try {
    target = assertSafePublicHttpUrl(urlParam.trim());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid URL';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Browser-like UA: some CDNs block minimal custom agents; TLS issues are separate (see fallback below).
        'User-Agent':
          'Mozilla/5.0 (compatible; AletheiaUrlImport/1.0; +https://www.iana.org/domains/example)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!upstream.ok) {
      if (allowExampleComDemoFallback() && isExampleComRootUrl(target)) {
        console.warn(
          `[import-url] Upstream ${upstream.status} for example.com; using demo fallback (set URL_IMPORT_DEMO_FALLBACK=0 to disable).`
        );
        return NextResponse.json(jsonFromExampleComFallback(target.toString()));
      }
      return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 });
    }

    const len = upstream.headers.get('content-length');
    if (len && Number(len) > MAX_BYTES) {
      return NextResponse.json({ error: 'Response too large' }, { status: 413 });
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Response too large' }, { status: 413 });
    }

    const raw = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    const contentType = upstream.headers.get('content-type');
    const fetchedUrl = upstream.url || target.toString();

    return NextResponse.json({ raw, contentType, fetchedUrl });
  } catch (e) {
    const cause =
      e instanceof Error && e.cause instanceof Error
        ? e.cause
        : e instanceof Error
          ? e
          : null;
    const causeCode = cause && 'code' in cause ? String((cause as NodeJS.ErrnoException).code) : '';
    const causeMsg = cause?.message ?? '';

    if (allowExampleComDemoFallback() && isExampleComRootUrl(target)) {
      console.warn(
        `[import-url] Fetch failed for example.com (${causeMsg || String(e)}); using demo fallback. ` +
          'Fix TLS: set NODE_EXTRA_CA_CERTS to your corporate root PEM, or trust the system cert store.'
      );
      return NextResponse.json(jsonFromExampleComFallback(target.toString()));
    }

    let message =
      e instanceof Error
        ? e.name === 'AbortError'
          ? 'Request timed out'
          : e.message
        : 'Fetch failed';

    if (
      causeCode === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
      /unable to get local issuer certificate/i.test(causeMsg)
    ) {
      message =
        'TLS certificate verification failed (common behind corporate proxies). Set NODE_EXTRA_CA_CERTS to your root CA bundle, or ask IT for the proxy certificate.';
    }

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
