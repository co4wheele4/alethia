/**
 * Provenance helpers
 *
 * We embed provenance as a small YAML-like frontmatter block at the beginning of chunk 0.
 * This keeps the original reference immutable and colocated with the source snapshot.
 *
 * This parser is intentionally narrow: it only understands simple `key: value` lines and
 * one nested level under `source:`. Anything unknown is preserved in `rawHeader`.
 */
export type Provenance = {
  ingestedAt?: string;
  contentSha256?: string;
  source?: {
    kind?: 'manual' | 'file' | 'url' | string;
    filename?: string;
    mimeType?: string;
    sizeBytes?: number;
    lastModifiedMs?: number;
    fileSha256?: string;
    url?: string;
    fetchedUrl?: string;
    contentType?: string | null;
    publisher?: string | null;
    author?: string | null;
    publishedAt?: string | null;
    accessedAt?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export function splitFrontmatter(content: string): { rawHeader: string | null; body: string } {
  if (!content.startsWith('---\n')) return { rawHeader: null, body: content };
  const endIdx = content.indexOf('\n---\n', 4);
  if (endIdx === -1) return { rawHeader: null, body: content };
  const rawHeader = content.slice(0, endIdx + '\n---\n'.length);
  const body = content.slice(endIdx + '\n---\n'.length);
  return { rawHeader, body };
}

function unquote(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      // We write quoted scalars using JSON.stringify, so JSON.parse is a safe best-effort.
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function toNumberOrString(v: string): number | string {
  const s = unquote(v);
  if (!s) return '';
  const n = Number(s);
  return Number.isFinite(n) && String(n) === s ? n : s;
}

/**
 * Parses a very small subset of YAML:
 * - top-level: `key: value`
 * - one nested object under `source:`
 */
export function parseProvenanceFromChunk0(chunk0Content: string): {
  provenance: Provenance | null;
  rawHeader: string | null;
  body: string;
} {
  const { rawHeader, body } = splitFrontmatter(chunk0Content);
  if (!rawHeader) return { provenance: null, rawHeader: null, body: chunk0Content };

  const headerInner = rawHeader.replace(/^---\n/, '').replace(/\n---\n$/, '');
  const lines = headerInner.split('\n');

  const prov: Provenance = {};
  let inSource = false;

  for (const line of lines) {
    if (!line.trim()) continue;
    const m = /^(\s*)([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const indent = m[1]?.length ?? 0;
    const key = m[2] ?? '';
    const rawVal = m[3] ?? '';

    if (indent === 0) {
      inSource = key === 'source' && rawVal.trim() === '';
      if (!inSource) {
        (prov as Record<string, unknown>)[key] = toNumberOrString(rawVal);
      } else {
        prov.source = prov.source ?? {};
      }
      continue;
    }

    // Nested under `source:` (we only support one level).
    if (inSource && indent >= 2) {
      prov.source = prov.source ?? {};
      (prov.source as Record<string, unknown>)[key] = toNumberOrString(rawVal);
    }
  }

  // Normalize a few well-known fields.
  if (typeof prov.ingestedAt !== 'string') delete prov.ingestedAt;
  if (typeof prov.contentSha256 !== 'string') delete prov.contentSha256;
  if (prov.source) {
    const src = prov.source;
    if (typeof src.kind !== 'string') delete src.kind;
    if (typeof src.publisher !== 'string' && src.publisher !== null) delete src.publisher;
    if (typeof src.author !== 'string' && src.author !== null) delete src.author;
    if (typeof src.contentType !== 'string' && src.contentType !== null) delete src.contentType;
    if (typeof src.publishedAt !== 'string' && src.publishedAt !== null) delete src.publishedAt;
  }

  return { provenance: prov, rawHeader, body };
}

