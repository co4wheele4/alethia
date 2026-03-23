'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { CLAIMS_BY_DOCUMENT_QUERY, LIST_CLAIMS_QUERY } from '../graphql';

export type ClaimStatus = 'DRAFT' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

/** Evidence (ADR-019): reference to source material; no confidence or inference. */
export type Evidence = {
  __typename?: 'Evidence';
  id: string;
  createdAt: string;
  createdBy: string;
  sourceType: string;
  sourceDocumentId?: string | null;
  chunkId?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  snippet?: string | null;
};

/** @deprecated Use Evidence. Kept for compatibility during migration. */
export type ClaimEvidence = Evidence;

export type ClaimDocument = {
  __typename?: 'Document';
  id: string;
  title: string;
  sourceLabel?: string | null;
  sourceType?: string | null;
};

export type Claim = {
  __typename?: 'Claim';
  id: string;
  text: string;
  status: ClaimStatus;
  createdAt: string;
  evidence: Evidence[];
  documents: ClaimDocument[];
};

type ListClaimsData = { claims: Claim[] };
type ClaimsByDocumentData = { claimsByDocument: Claim[] };

function fail(message: string): never {
  throw new Error(`[Claims] ${message}`);
}

export function assertClaimsGrounded(claims: Claim[]) {
  for (const c of claims) {
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
      fail(`Claim(${c.id}) violates contract: evidence[] must be non-empty`);
    }
  }
}

export function useClaims(documentId: string | null) {
  const useDocScoped = Boolean(documentId);

  const variables = useMemo(() => ({ documentId: documentId ?? '' }), [documentId]);

  const query = useQuery<ListClaimsData | ClaimsByDocumentData>(
    useDocScoped ? CLAIMS_BY_DOCUMENT_QUERY : LIST_CLAIMS_QUERY,
    {
      variables: useDocScoped ? variables : undefined,
      skip: useDocScoped ? !documentId : false,
      fetchPolicy: 'cache-and-network',
    }
  );

  const claims = useMemo(() => {
    const raw = (useDocScoped
      ? (query.data as ClaimsByDocumentData | undefined)?.claimsByDocument
      : (query.data as ListClaimsData | undefined)?.claims) ?? [];
    assertClaimsGrounded(raw);
    return raw;
  }, [query.data, useDocScoped]);

  return {
    claims,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

