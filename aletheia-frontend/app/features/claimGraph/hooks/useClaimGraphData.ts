'use client';

import { useMemo } from 'react';
import { useClaims } from '../../claims/hooks/useClaims';
import { claimsToGraph } from '../transform';
import type { ClaimEvidenceGraphData } from '../types';

export type EvidenceMeta = Map<string, { sourceDocumentId?: string | null; chunkId?: string | null }>;

/**
 * Fetch claims (with evidence) and transform to ADR-021 graph topology.
 * No additional API calls; no inference; no derived edges.
 */
export function useClaimGraphData(documentId: string | null): {
  data: ClaimEvidenceGraphData;
  evidenceMeta: EvidenceMeta;
  loading: boolean;
  error: Error | null;
} {
  const { claims, loading, error } = useClaims(documentId);

  const { data, evidenceMeta } = useMemo(() => {
    const data = claimsToGraph(claims);
    const meta: EvidenceMeta = new Map();
    for (const c of claims) {
      for (const ev of c.evidence ?? []) {
        if (!meta.has(ev.id)) {
          meta.set(ev.id, {
            sourceDocumentId: ev.sourceDocumentId ?? null,
            chunkId: ev.chunkId ?? null,
          });
        }
      }
    }
    return { data, evidenceMeta: meta };
  }, [claims]);

  return { data, evidenceMeta, loading, error };
}
