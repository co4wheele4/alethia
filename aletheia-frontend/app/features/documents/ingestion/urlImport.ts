/**
 * URL import: fetches HTML/text via same-origin `/api/import-url` so the browser
 * is not blocked by CORS when snapshotting public http(s) pages.
 */
'use client';

export type ImportedUrl = {
  title: string;
  text: string;
  contentType: string | null;
  fetchedUrl: string;
  publisher: string | null;
  publishedAtIso: string | null;
  author: string | null;
};

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
  return (doc.body?.textContent ?? '').replace(/\s+\n/g, '\n').trim();
}

function firstMetaContent(doc: Document, selectors: string[]): string | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (!el) continue;
    const content = el.getAttribute('content')?.trim();
    if (content) return content;
    const datetime = el.getAttribute('datetime')?.trim();
    if (datetime) return datetime;
  }
  return null;
}

function toIsoOrNull(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

async function fetchUrlViaServerProxy(targetUrl: string): Promise<{
  raw: string;
  contentType: string | null;
  fetchedUrl: string;
}> {
  const qs = new URLSearchParams({ url: targetUrl });
  const proxyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/import-url?${qs}`
      : `/api/import-url?${qs}`;

  let res: Response;
  try {
    res = await fetch(proxyUrl, { method: 'GET' });
  } catch (e) {
    const base = e instanceof Error ? e.message : 'Network error';
    throw new Error(
      base === 'Failed to fetch'
        ? 'Could not reach the URL import service. Wait for the page to finish loading, then try again.'
        : base
    );
  }

  let data: {
    raw?: string;
    contentType?: string | null;
    fetchedUrl?: string;
    error?: string;
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new Error(
      `URL import returned a non-JSON response (${res.status}). Is the Next.js dev server running?`
    );
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to fetch URL (${res.status}).`);
  }
  return {
    raw: data.raw ?? '',
    contentType: data.contentType ?? null,
    fetchedUrl: data.fetchedUrl ?? targetUrl,
  };
}

export async function importUrlToText(url: string): Promise<ImportedUrl> {
  const { raw, contentType, fetchedUrl } = await fetchUrlViaServerProxy(url);

  // Default to HTML extraction when applicable; otherwise keep raw text.
  const isHtml = (contentType ?? '').toLowerCase().includes('text/html');
  const text = isHtml ? htmlToText(raw) : raw.trim();

  // Best-effort title extraction:
  let title = url;
  let publisher: string | null = null;
  let publishedAtIso: string | null = null;
  let author: string | null = null;
  if (isHtml) {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const t = doc.querySelector('title')?.textContent?.trim();
    if (t) title = t;

    // Best-effort provenance metadata (may be absent).
    publisher = firstMetaContent(doc, [
      'meta[property="og:site_name"]',
      'meta[name="publisher"]',
      'meta[property="article:publisher"]',
      'meta[name="application-name"]',
    ]);
    author = firstMetaContent(doc, ['meta[name="author"]', 'meta[property="article:author"]']);
    publishedAtIso = toIsoOrNull(
      firstMetaContent(doc, [
        'meta[property="article:published_time"]',
        'meta[name="pubdate"]',
        'meta[name="publishdate"]',
        'meta[name="date"]',
        'time[datetime]',
      ])
    );
  }

  return { title, text, contentType, fetchedUrl, publisher, publishedAtIso, author };
}

