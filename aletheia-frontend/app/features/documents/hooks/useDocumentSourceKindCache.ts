/**
 * useDocumentSourceKindCache
 *
 * Source kind (file/url/manual) is embedded in the immutable provenance header (chunk 0 content).
 * The Document Index query intentionally does not fetch chunk content, so we cache discovered kinds
 * client-side as an explicit, inspectable UX convenience.
 *
 * This cache never "guesses" a kind: it only stores values parsed from provenance headers the user has already opened.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type SourceKind = 'manual' | 'file' | 'url' | 'unknown';

type CacheShape = Record<string, SourceKind>;

const STORAGE_KEY = 'aletheia.documentSourceKinds.v1';

function safeParse(json: string | null): CacheShape {
  if (!json) return {};
  try {
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== 'object') return {};
    const out: CacheShape = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === 'manual' || val === 'file' || val === 'url' || val === 'unknown') out[k] = val;
    }
    return out;
  } catch {
    return {};
  }
}

export function useDocumentSourceKindCache() {
  const [map, setMap] = useState<CacheShape>({});

  useEffect(() => {
    // Client-only storage.
    setMap(safeParse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? null));
  }, []);

  const setKindForDocument = useCallback((documentId: string, kind: SourceKind) => {
    setMap((prev) => {
      const next: CacheShape = { ...prev, [documentId]: kind };
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Non-fatal (e.g., storage blocked).
      }
      return next;
    });
  }, []);

  const getKindForDocument = useCallback((documentId: string) => {
    return map[documentId] ?? 'unknown';
  }, [map]);

  return useMemo(
    () => ({
      kindByDocumentId: map,
      getKindForDocument,
      setKindForDocument,
    }),
    [map, getKindForDocument, setKindForDocument]
  );
}

