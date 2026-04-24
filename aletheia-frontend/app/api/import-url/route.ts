import { NextRequest, NextResponse } from 'next/server';
import http, { type IncomingHttpHeaders } from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';

import {
  assertPublicHttpUrlForServerFetch,
  type ResolvedPublicHttpFetchTarget,
  resolvePublicHttpFetchTarget,
} from './ssrf-public-url';

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

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string,
  family: number,
) => void;

type UpstreamResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
  fetchedUrl: string;
};

function headerValue(
  headers: IncomingHttpHeaders,
  name: string,
): string | null {
  const raw = headers[name];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

function boundLookup(address: string, family: 4 | 6) {
  return (
    _hostname: string,
    _options: unknown,
    callback: LookupCallback,
  ) => {
    callback(null, address, family);
  };
}

function requestOnceBoundToResolvedTarget(
  target: ResolvedPublicHttpFetchTarget,
  signal: AbortSignal,
): Promise<UpstreamResponse> {
  return new Promise((resolve, reject) => {
    const isHttps = target.url.protocol === 'https:';
    const port = target.url.port ? Number(target.url.port) : isHttps ? 443 : 80;
    const requestFn = isHttps ? https.request : http.request;
    const hostHeader = target.url.host;
    const servername =
      isHttps && isIP(target.url.hostname) === 0 ? target.url.hostname : undefined;

    const req = requestFn(
      {
        protocol: target.url.protocol,
        hostname: target.address,
        port,
        method: 'GET',
        path: `${target.url.pathname}${target.url.search}`,
        headers: {
          ...FETCH_HEADERS,
          Host: hostHeader,
        },
        family: target.family,
        lookup: boundLookup(target.address, target.family),
        servername,
        signal,
      },
      (res) => {
        const declaredLength = Number(headerValue(res.headers, 'content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
          res.resume();
          reject(new Error('Response too large'));
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;

        res.on('data', (chunk: Buffer | string) => {
          const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          total += part.byteLength;
          if (total > MAX_BYTES) {
            res.destroy(new Error('Response too large'));
            return;
          }
          chunks.push(part);
        });
        res.on('error', reject);
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
            fetchedUrl: target.url.toString(),
          });
        });
      },
    );

    req.on('error', reject);
    req.end();
  });
}

/**
 * Request with the connection pinned to a vetted IP address, then re-validate each
 * redirect target before the next hop. This avoids DNS rebinding between validation
 * and connect while still applying SSRF checks to every redirect.
 *
 * Each outbound request uses a `lookup` override bound to the address returned by
 * `resolvePublicHttpFetchTarget` in the same iteration (DNS + blocklist checks).
 */
async function requestUrlWithSsrfGuards(
  validatedFirst: URL,
  signal: AbortSignal,
): Promise<UpstreamResponse> {
  let current: URL = validatedFirst;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const safe = await resolvePublicHttpFetchTarget(current);
    const upstream = await requestOnceBoundToResolvedTarget(safe, signal);

    if (REDIRECT_STATUSES.has(upstream.status)) {
      const loc = headerValue(upstream.headers, 'location');
      if (!loc) {
        return upstream;
      }
      let next: URL;
      try {
        next = new URL(loc, safe.url);
      } catch {
        throw new Error('Invalid redirect URL');
      }
      current = next;
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
    const upstream = await requestUrlWithSsrfGuards(target, controller.signal);

    if (upstream.status < 200 || upstream.status >= 300) {
      if (allowExampleComDemoFallback() && isExampleComRootUrl(target)) {
        console.warn(
          `[import-url] Upstream ${upstream.status} for example.com; using demo fallback (set URL_IMPORT_DEMO_FALLBACK=0 to disable).`
        );
        return NextResponse.json(jsonFromExampleComFallback(target.toString()));
      }
      return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 });
    }

    if (upstream.body.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Response too large' }, { status: 413 });
    }

    const raw = new TextDecoder('utf-8', { fatal: false }).decode(upstream.body);
    const contentType = headerValue(upstream.headers, 'content-type');
    const fetchedUrl = upstream.fetchedUrl || target.toString();

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
    if (/response too large/i.test(message)) {
      return NextResponse.json({ error: 'Response too large' }, { status: 413 });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
