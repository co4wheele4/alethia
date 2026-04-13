import { NextRequest, NextResponse } from 'next/server';

import { assertPublicHttpUrlForServerFetch } from './ssrf-public-url';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 10;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

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

const FETCH_HEADERS = {
  // Browser-like UA: some CDNs block minimal custom agents; TLS issues are separate (see fallback below).
  'User-Agent':
    'Mozilla/5.0 (compatible; AletheiaUrlImport/1.0; +https://www.iana.org/domains/example)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
} as const;

/**
 * Fetch with `redirect: manual` and re-validate each redirect target with
 * {@link assertPublicHttpUrlForServerFetch} so redirects cannot bypass SSRF checks.
 */
async function fetchUrlWithSsrfGuards(
  validatedFirst: URL,
  signal: AbortSignal,
): Promise<Response> {
  let current = validatedFirst;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    // First hop uses a URL already validated by the caller; subsequent hops validate redirects.
    const upstream = await fetch(current.href, {
      method: 'GET',
      redirect: 'manual',
      signal,
      headers: { ...FETCH_HEADERS },
    });

    if (REDIRECT_STATUSES.has(upstream.status)) {
      const loc = upstream.headers.get('location');
      await upstream.body?.cancel();
      if (!loc) {
        return upstream;
      }
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        throw new Error('Invalid redirect URL');
      }
      current = await assertPublicHttpUrlForServerFetch(next.href);
      continue;
    }

    return upstream;
  }
  throw new Error('Too many redirects');
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  if (!urlParam?.trim()) {
    return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
  }

  let target: URL;
  try {
    target = await assertPublicHttpUrlForServerFetch(urlParam.trim());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid URL';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetchUrlWithSsrfGuards(target, controller.signal);

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
