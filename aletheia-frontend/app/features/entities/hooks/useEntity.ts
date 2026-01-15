'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { ENTITY_QUERY } from '../graphql';

export type EntityRelationship = {
  __typename?: 'EntityRelationship';
  id: string;
  relation: string;
  to?: { __typename?: 'Entity'; id: string; name: string; type: string } | null;
  from?: { __typename?: 'Entity'; id: string; name: string; type: string } | null;
};

export type EntityMention = {
  __typename?: 'EntityMention';
  id: string;
  startOffset?: number | null;
  endOffset?: number | null;
  spanText?: string | null;
  confidence?: number | null;
  chunk: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    document: { __typename?: 'Document'; id: string; title: string; createdAt: string };
  };
};

export type EntityDetail = {
  __typename?: 'Entity';
  id: string;
  name: string;
  type: string;
  outgoing: Array<{
    __typename?: 'EntityRelationship';
    id: string;
    relation: string;
    to: { __typename?: 'Entity'; id: string; name: string; type: string };
  }>;
  incoming: Array<{
    __typename?: 'EntityRelationship';
    id: string;
    relation: string;
    from: { __typename?: 'Entity'; id: string; name: string; type: string };
  }>;
  mentions: EntityMention[];
};

type EntityData = {
  entity: EntityDetail | null;
};

type EntityVars = {
  id: string;
};

export function useEntity(entityId: string | null) {
  const vars = useMemo(() => ({ id: entityId ?? '' }), [entityId]);

  const query = useQuery<EntityData, EntityVars>(ENTITY_QUERY, {
    variables: vars,
    skip: !entityId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    entity: query.data?.entity ?? null,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

