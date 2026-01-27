'use client';

import { useApolloClient } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { GET_DOCUMENT_EVIDENCE_VIEW_QUERY, LIST_RELATIONSHIPS_QUERY } from '@/src/graphql';
import { useClaims, type Claim, type ClaimEvidence, type ClaimStatus } from '../../claims/hooks/useClaims';

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

type Relationship = {
  __typename?: 'EntityRelationship';
  id: string;
  evidence: Array<{
    __typename?: 'EntityRelationshipEvidence';
    id: string;
    chunkId: string;
    startOffset?: number | null;
    endOffset?: number | null;
    chunk: {
      __typename?: 'DocumentChunk';
      id: string;
      chunkIndex: number;
      content: string;
      documentId: string;
      document: {
        __typename?: 'Document';
        id: string;
        title: string;
        sourceLabel?: string | null;
      };
    };
  }>;
};

type GetDocumentEvidenceViewData = { document: DocumentEvidenceView | null };
type GetDocumentEvidenceViewVars = { id: string };
type ListRelationshipsData = { entityRelationships: Relationship[] };

function mentionEvidenceItems(args: {
  claimEvidence: ClaimEvidence[];
  docsById: Map<string, DocumentEvidenceView>;
}): ClaimReviewEvidenceItem[] {
  const { claimEvidence, docsById } = args;
  const items: ClaimReviewEvidenceItem[] = [];

  for (const ev of claimEvidence) {
    const doc = docsById.get(ev.documentId);
    if (!doc) continue;

    const mentionIds = uniqueStrings(ev.mentionIds);
    if (mentionIds.length === 0) continue;

    for (const chunk of doc.chunks ?? []) {
      for (const m of chunk.mentions ?? []) {
        if (!mentionIds.includes(m.id)) continue;
        const startOffset = assertPresent(m.startOffset, `EntityMention(${m.id}).startOffset`);
        const endOffset = assertPresent(m.endOffset, `EntityMention(${m.id}).endOffset`);
        const snippet =
          sliceByOffsets(chunk.content ?? '', startOffset, endOffset) ??
          fail(`EntityMention(${m.id}) offsets could not be applied to chunk content`);

        items.push({
          kind: 'mention',
          evidenceId: ev.id,
          documentId: doc.id,
          documentTitle: doc.title,
          sourceLabel: doc.sourceLabel ?? null,
          chunkId: chunk.id,
          chunkIndex: chunk.chunkIndex,
          startOffset,
          endOffset,
          snippet,
          mentionId: m.id,
          entityName: m.entity?.name ?? m.excerpt ?? null,
          jumpHref: `/documents?documentId=${encodeURIComponent(doc.id)}&mentionId=${encodeURIComponent(m.id)}`,
        });
      }
    }
  }

  return items;
}

function relationshipEvidenceItems(args: {
  claimEvidence: ClaimEvidence[];
  relationshipsById: Map<string, Relationship>;
}): ClaimReviewEvidenceItem[] {
  const { claimEvidence, relationshipsById } = args;
  const items: ClaimReviewEvidenceItem[] = [];

  for (const ev of claimEvidence) {
    const relationshipIds = uniqueStrings(ev.relationshipIds);
    for (const relationshipId of relationshipIds) {
      const rel = relationshipsById.get(relationshipId);
      if (!rel) continue;

      for (const anchor of rel.evidence ?? []) {
        const startOffset = assertPresent(anchor.startOffset, `EntityRelationshipEvidence(${anchor.id}).startOffset`);
        const endOffset = assertPresent(anchor.endOffset, `EntityRelationshipEvidence(${anchor.id}).endOffset`);
        const content = assertPresent(anchor.chunk?.content, `EntityRelationshipEvidence(${anchor.id}).chunk.content`);
        const snippet =
          sliceByOffsets(content, startOffset, endOffset) ??
          fail(`EntityRelationshipEvidence(${anchor.id}) offsets could not be applied to chunk content`);

        const doc = assertPresent(anchor.chunk?.document, `EntityRelationshipEvidence(${anchor.id}).chunk.document`);

        items.push({
          kind: 'relationship',
          evidenceId: ev.id,
          relationshipId,
          documentId: doc.id,
          documentTitle: doc.title,
          sourceLabel: doc.sourceLabel ?? null,
          chunkId: anchor.chunkId,
          chunkIndex: anchor.chunk.chunkIndex,
          startOffset,
          endOffset,
          snippet,
          // Relationship anchors don't guarantee a concrete mention jump; fall back to document route.
          jumpHref: `/documents/${encodeURIComponent(doc.id)}`,
        });
      }
    }
  }

  return items;
}

export function useClaimReview(claimId: string) {
  const client = useApolloClient();

  const { claims, loading: claimsLoading, error: claimsError } = useClaims(null);

  const claim: Claim | null = useMemo(
    () => claims.find((c) => c.id === claimId) ?? null,
    [claims, claimId]
  );

  const claimEvidence = useMemo(() => claim?.evidence ?? [], [claim]);

  const needsRelationshipFetch = useMemo(
    () => claimEvidence.some((e) => (e.relationshipIds ?? []).length > 0),
    [claimEvidence]
  );

  const documentIds = useMemo(() => uniqueStrings(claimEvidence.map((e) => e.documentId)), [claimEvidence]);

  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<Error | null>(null);
  const [docsById, setDocsById] = useState<Map<string, DocumentEvidenceView>>(new Map());
  const [relationshipsById, setRelationshipsById] = useState<Map<string, Relationship>>(new Map());

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

        const relsById = new Map<string, Relationship>();
        if (needsRelationshipFetch) {
          const relRes = await client.query<ListRelationshipsData>({
            query: LIST_RELATIONSHIPS_QUERY,
            fetchPolicy: 'cache-first',
          });
          for (const r of relRes.data?.entityRelationships ?? []) {
            relsById.set(r.id, r);
          }
        }

        if (cancelled) return;
        setDocsById(docs);
        setRelationshipsById(relsById);
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
  }, [client, claim, documentIds, needsRelationshipFetch]);

  const { evidenceItems, contractError } = useMemo(() => {
    if (!claim) return { evidenceItems: [] as ClaimReviewEvidenceItem[], contractError: null as Error | null };
    // While loading, do not fail: the required evidence may simply not be fetched yet.
    if (evidenceLoading || evidenceError) return { evidenceItems: [], contractError: null };

    try {
      const items = [
        ...mentionEvidenceItems({ claimEvidence, docsById }),
        ...relationshipEvidenceItems({ claimEvidence, relationshipsById }),
      ];

      // Evidence MUST be explicit. If we cannot resolve any concrete offset snippets AFTER loading completes,
      // this claim is not reviewable and the UI must surface a hard contract error (no silent fallback).
      if (items.length === 0) {
        throw new Error(
          `No renderable evidence snippets resolved for Claim(${claim.id}). ` +
            `ClaimEvidence references must resolve to offset-based snippets.`
        );
      }

      return { evidenceItems: items, contractError: null };
    } catch (err) {
      return { evidenceItems: [], contractError: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [claim, claimEvidence, docsById, relationshipsById, evidenceError, evidenceLoading]);

  const allowedNext = useMemo(() => {
    if (!claim) return [];
    return [...(CLAIM_LIFECYCLE_TRANSITIONS[claim.status] ?? [])];
  }, [claim]);

  /**
   * Adjudication contract note:
   * The current backend schema does NOT expose any claim lifecycle mutation.
   * Therefore the UI must block review actions instead of simulating state changes.
   */
  const adjudication = useMemo(() => {
    return {
      available: false as const,
      reason:
        'Backend GraphQL schema does not expose claim review/adjudication mutations (no way to persist lifecycle transitions).',
    };
  }, []);

  const requestTransition = useCallback(
    async (_to: ClaimStatus, _note?: string | null) => {
      void _note;
      fail(
        `Cannot transition Claim(${claimId}) because adjudication mutations are not exposed by the schema.`
      );
    },
    [claimId]
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

