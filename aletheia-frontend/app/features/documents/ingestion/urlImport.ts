/**
 * URL import (client-side, best-effort)
 *
 * Note: Many sites block cross-origin fetch from browsers (CORS).
 * When fetch fails, we surface a clear error so users understand the limitation.
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

export async function importUrlToText(url: string): Promise<ImportedUrl> {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status}).`);
  }

  const contentType = res.headers.get('content-type');
  const fetchedUrl = res.url || url;
  const raw = await res.text();

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

