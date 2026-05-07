/**
 * Document chunks hook
 *
 * Fetches chunk content + entity mentions for a given document id.
 * Kept separate from the main documents list to avoid over-fetching.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { CHUNKS_BY_DOCUMENT_QUERY, DOCUMENT_QUERY } from '../graphql';

export type EntityMentionItem = {
  __typename?: 'EntityMention';
  id: string;
  entityId: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
  entity: {
    __typename?: 'Entity';
    id: string;
    name: string;
    type: string;
  };
};

export type DocumentChunkItem = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  content: string;
  mentions: EntityMentionItem[];
};

export type DocumentHeader = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
};

type DocumentData = {
  document: DocumentHeader | null;
};

type DocumentVars = {
  id: string;
};

type ChunksByDocumentData = {
  chunksByDocument: DocumentChunkItem[];
};

type ChunksByDocumentVars = {
  documentId: string;
};

export function useDocumentHeader(documentId: string | null) {
  const docVars = useMemo(() => ({ id: documentId ?? '' }), [documentId]);

  const query = useQuery<DocumentData, DocumentVars>(DOCUMENT_QUERY, {
    variables: docVars,
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    document: query.data?.document ?? null,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

export function useChunksByDocument(documentId: string | null) {
  const vars = useMemo(() => ({ documentId: documentId ?? '' }), [documentId]);

  const query = useQuery<ChunksByDocumentData, ChunksByDocumentVars>(CHUNKS_BY_DOCUMENT_QUERY, {
    variables: vars,
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    chunks: query.data?.chunksByDocument ?? [],
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
