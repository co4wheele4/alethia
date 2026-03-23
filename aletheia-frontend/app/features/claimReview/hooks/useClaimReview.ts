'use client';

import { useApolloClient } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GET_DOCUMENT_EVIDENCE_VIEW_QUERY } from '@/src/graphql';
import { useClaims, type Claim, type Evidence, type ClaimStatus } from '../../claims/hooks/useClaims';
import { useAdjudicateClaim, type ClaimLifecycleState } from './useAdjudicateClaim';

export type ClaimReviewEvidenceItem =
  | {
      kind: 'mention';
      evidenceId: string;
      documentId: string;
      documentTitle: string;
      sourceLabel?: string | null;
      chunkId: string;
      chunkIndex: number;
      startOffset: number;
      endOffset: number;
      snippet: string;
      mentionId: string;
      entityName?: string | null;
      jumpHref: string;
    }
  | {
      kind: 'relationship';
      evidenceId: string;
      relationshipId: string;
      documentId: string;
      documentTitle: string;
      sourceLabel?: string | null;
      chunkId: string;
      chunkIndex: number;
      startOffset: number;
      endOffset: number;
      snippet: string;
      jumpHref: string;
    };

export const CLAIM_LIFECYCLE_TRANSITIONS: Record<ClaimStatus, readonly ClaimStatus[]> = {
  DRAFT: ['REVIEWED'],
  REVIEWED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
} as const;

export function canTransitionClaim(from: ClaimStatus, to: ClaimStatus): boolean {
  return (CLAIM_LIFECYCLE_TRANSITIONS[from] ?? []).includes(to);
}

function sliceByOffsets(content: string, start: number | null | undefined, end: number | null | undefined) {
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  if (start < 0 || end <= start || end > content.length) return null;
  return content.slice(start, end);
}

function fail(message: string): never {
  throw new Error(`[ClaimReview] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

type DocumentEvidenceView = {
  __typename?: 'Document';
  id: string;
  title: string;
  sourceLabel?: string | null;
  chunks: Array<{
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    mentions: Array<{
      __typename?: 'EntityMention';
      id: string;
      startOffset?: number | null;
      endOffset?: number | null;
      excerpt?: string | null;
      entity?: { __typename?: 'Entity'; name?: string | null } | null;
    }>;
  }>;
};

type GetDocumentEvidenceViewData = { document: DocumentEvidenceView | null };
type GetDocumentEvidenceViewVars = { id: string };

/** Build evidence items from Evidence spans (ADR-019). Evidence has locator (chunkId, startOffset, endOffset) directly.
 * ADR-020: snippets are verbatim from chunk content; no paraphrase or summarization. */
function evidenceSpanItems(args: {
  claimEvidence: Evidence[];
  docsById: Map<string, DocumentEvidenceView>;
}): ClaimReviewEvidenceItem[] {
  const { claimEvidence, docsById } = args;
  const items: ClaimReviewEvidenceItem[] = [];

  for (const ev of claimEvidence) {
    const docId = ev.sourceDocumentId;
    if (!docId) continue;
    const doc = docsById.get(docId);
    if (!doc) continue;

    const chunkId = ev.chunkId;
    const startOffset = ev.startOffset;
    const endOffset = ev.endOffset;
    if (chunkId == null || startOffset == null || endOffset == null) continue;

    const chunk = doc.chunks?.find((c) => c.id === chunkId);
    if (!chunk) continue;

    const snippet =
      ev.snippet ??
      sliceByOffsets(chunk.content ?? '', startOffset, endOffset) ??
      '';

    items.push({
      kind: 'mention',
      evidenceId: ev.id,
      documentId: doc.id,
      documentTitle: doc.title,
      sourceLabel: doc.sourceLabel ?? null,
      chunkId,
      chunkIndex: chunk.chunkIndex,
      startOffset,
      endOffset,
      snippet,
      mentionId: '',
      entityName: null,
      jumpHref: `/documents/${encodeURIComponent(doc.id)}?chunkId=${encodeURIComponent(chunkId)}`,
    });
  }

  return items;
}

export function useClaimReview(claimId: string) {
  const client = useApolloClient();

  const { claims, loading: claimsLoading, error: claimsError, refetch: refetchClaims } = useClaims(null);

  const claim: Claim | null = useMemo(
    () => claims.find((c) => c.id === claimId) ?? null,
    [claims, claimId]
  );

  const claimEvidence = useMemo(() => claim?.evidence ?? [], [claim]);

  const documentIds = useMemo(
    () => uniqueStrings(claimEvidence.map((e) => e.sourceDocumentId).filter(Boolean) as string[]),
    [claimEvidence]
  );

  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<Error | null>(null);
  const [docsById, setDocsById] = useState<Map<string, DocumentEvidenceView>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadEvidence() {
      if (!claim) return;

      setEvidenceLoading(true);
      setEvidenceError(null);

      try {
        const docs = new Map<string, DocumentEvidenceView>();
        for (const id of documentIds) {
          const res = await client.query<GetDocumentEvidenceViewData, GetDocumentEvidenceViewVars>({
            query: GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
            variables: { id },
            fetchPolicy: 'cache-first',
          });
          const doc = res.data?.document ?? null;
          if (doc) docs.set(id, doc);
        }

        if (cancelled) return;
        setDocsById(docs);
      } catch (err) {
        if (cancelled) return;
        setEvidenceError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setEvidenceLoading(false);
      }
    }

    void loadEvidence();

    return () => {
      cancelled = true;
    };
  }, [client, claim, documentIds]);

  const { evidenceItems, contractError } = useMemo(() => {
    if (!claim) return { evidenceItems: [] as ClaimReviewEvidenceItem[], contractError: null as Error | null };
    // While loading, do not fail: the required evidence may simply not be fetched yet.
    if (evidenceLoading || evidenceError) return { evidenceItems: [], contractError: null };

    try {
      const items = evidenceSpanItems({ claimEvidence, docsById });

      // Evidence MUST be explicit. If we cannot resolve any concrete offset snippets AFTER loading completes,
      // this claim is not reviewable and the UI must surface a hard contract error (no silent fallback).
      if (items.length === 0) {
        throw new Error(
          `No renderable evidence snippets resolved for Claim(${claim.id}). ` +
            `Evidence references must resolve to offset-based snippets.`
        );
      }

      return { evidenceItems: items, contractError: null };
    } catch (err) {
      return { evidenceItems: [], contractError: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [claim, claimEvidence, docsById, evidenceError, evidenceLoading]);

  const allowedNext = useMemo(() => {
    if (!claim) return [];
    return [...(CLAIM_LIFECYCLE_TRANSITIONS[claim.status] ?? [])];
  }, [claim]);

  const { adjudicate, loading: adjudicationLoading, error: adjudicationError } = useAdjudicateClaim(claimId);

  const adjudication = useMemo(() => {
    return {
      available: true as const,
      loading: adjudicationLoading,
      error: adjudicationError,
    };
  }, [adjudicationError, adjudicationLoading]);

  function mapStatusToDecision(next: ClaimStatus): ClaimLifecycleState {
    // ADR-011: mutation input uses REVIEW (not REVIEWED) to transition DRAFT -> REVIEWED.
    if (next === 'REVIEWED') return 'REVIEW';
    return next;
  }

  const requestTransition = useCallback(
    async (to: ClaimStatus, note?: string | null) => {
      if (!claim) fail(`Cannot transition Claim(${claimId}) because claim is not loaded.`);
      if (!canTransitionClaim(claim.status, to)) return;

      const decision = mapStatusToDecision(to);
      const updated = await adjudicate(decision, note ?? null);
      if (updated) {
        // Ensure the UI reflects backend truth, including across reloads.
        await refetchClaims();
      }
    },
    [adjudicate, claim, claimId, refetchClaims]
  );

  return {
    claim,
    claimsLoading,
    claimsError,
    evidenceItems,
    evidenceLoading,
    evidenceError,
    contractError,
    allowedNext,
    canTransition: claim ? (to: ClaimStatus) => canTransitionClaim(claim.status, to) : () => false,
    adjudication,
    requestTransition,
  };
}

