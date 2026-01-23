'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { GET_CLAIMS_FOR_COMPARISON_QUERY } from '@/src/graphql';

export type ClaimComparisonEntity = {
  __typename?: 'Entity';
  id: string;
  name: string;
  type: string;
  mentionCount: number;
};

export type ClaimComparisonMention = {
  __typename?: 'EntityMention';
  id: string;
  entityId: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
  entity: ClaimComparisonEntity;
};

export type ClaimComparisonChunk = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  mentions: ClaimComparisonMention[];
};

export type ClaimComparisonDocument = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  chunks: ClaimComparisonChunk[];
};

export type ClaimComparisonEvidence = {
  __typename?: 'ClaimEvidence';
  id: string;
  claimId: string;
  documentId: string;
  createdAt: string;
  mentionIds: string[];
  relationshipIds: string[];
};

export type ClaimComparisonClaim = {
  __typename?: 'Claim';
  id: string;
  text: string;
  status: 'DRAFT' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  evidence: ClaimComparisonEvidence[];
  documents: ClaimComparisonDocument[];
};

type GetClaimsForComparisonData = { claims: ClaimComparisonClaim[] };

function fail(message: string): never {
  throw new Error(`[ClaimComparison] ${message}`);
}

function assertClaimsGrounded(claims: ClaimComparisonClaim[]) {
  for (const c of claims) {
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
      fail(`Claim(${c.id}) violates contract: evidence[] must be non-empty`);
    }
  }
}

export function useClaimsForComparison() {
  const query = useQuery<GetClaimsForComparisonData>(GET_CLAIMS_FOR_COMPARISON_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const claims = useMemo(() => {
    const raw = query.data?.claims ?? [];
    assertClaimsGrounded(raw);
    return raw;
  }, [query.data]);

  return {
    claims,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

