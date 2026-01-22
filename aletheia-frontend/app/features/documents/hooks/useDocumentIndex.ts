/**
 * useDocumentIndex
 *
 * Fetches document list + lightweight chunk/mention metadata for the Document Index view.
 *
 * This hook is intentionally read-only and non-interpretive:
 * - It returns inspectable counts (chunks, mentions, unique entities)
 * - It does not derive summaries or conclusions
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { DOCUMENT_INDEX_BY_USER_QUERY } from '../graphql';

export type DocumentIndexEntity = {
  __typename?: 'Entity';
  id: string;
  name: string;
  type: string;
};

export type DocumentIndexMention = {
  __typename?: 'EntityMention';
  id: string;
  entity: DocumentIndexEntity;
};

export type DocumentIndexChunk = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  mentions: DocumentIndexMention[];
};

export type DocumentIndexDocument = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  chunks: DocumentIndexChunk[];
};

export type DocumentIndexItem = {
  id: string;
  title: string;
  dateAddedIso: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  chunkCount: number;
  mentionCount: number;
  entityCount: number;
};

type DocumentIndexByUserData = {
  documentsByUser: DocumentIndexDocument[];
};

type DocumentIndexByUserVars = {
  userId: string;
};

function computeIndexItem(doc: DocumentIndexDocument): DocumentIndexItem {
  const chunks = doc.chunks ?? [];

  let mentionCount = 0;
  const entityIds = new Set<string>();
  for (const c of chunks) {
    const mentions = c.mentions ?? [];
    mentionCount += mentions.length;
    for (const m of mentions) {
      if (m?.entity?.id) entityIds.add(m.entity.id);
    }
  }

  return {
    id: doc.id,
    title: doc.title,
    dateAddedIso: doc.createdAt,
    sourceType: doc.sourceType ?? null,
    sourceLabel: doc.sourceLabel ?? null,
    chunkCount: chunks.length,
    mentionCount,
    entityCount: entityIds.size,
  };
}

export function useDocumentIndex(userId: string | null) {
  const variables = useMemo(() => ({ userId: userId ?? '' }), [userId]);

  const query = useQuery<DocumentIndexByUserData, DocumentIndexByUserVars>(DOCUMENT_INDEX_BY_USER_QUERY, {
    variables,
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const items = useMemo(() => {
    const docs = query.data?.documentsByUser ?? [];
    return docs.map(computeIndexItem);
  }, [query.data]);

  return {
    documents: items,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

