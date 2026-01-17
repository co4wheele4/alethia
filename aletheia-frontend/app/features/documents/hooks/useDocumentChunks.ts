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
  startOffset?: number | null;
  endOffset?: number | null;
  spanText?: string | null;
  confidence?: number | null;
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
  aiSuggestions: AiExtractionSuggestionItem[];
};

export type AiExtractionSuggestionItem = {
  __typename?: 'AiExtractionSuggestion';
  id: string;
  kind: 'ENTITY_MENTION' | 'RELATIONSHIP';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  entityName?: string | null;
  entityType?: string | null;
  subjectName?: string | null;
  subjectType?: string | null;
  objectName?: string | null;
  objectType?: string | null;
  relation?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
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

/**
 * Deprecated: combines two queries (Document + Chunks) in one hook.
 * Prefer `useDocumentHeader` and `useChunksByDocument` in separate containers for strict query/component mapping.
 */
export function useDocumentDetails(documentId: string | null) {
  const docVars = useMemo(() => ({ id: documentId ?? '' }), [documentId]);
  const chunksVars = useMemo(() => ({ documentId: documentId ?? '' }), [documentId]);

  const documentQuery = useQuery<DocumentData, DocumentVars>(DOCUMENT_QUERY, {
    variables: docVars,
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  const chunksQuery = useQuery<ChunksByDocumentData, ChunksByDocumentVars>(CHUNKS_BY_DOCUMENT_QUERY, {
    variables: chunksVars,
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    document: documentQuery.data?.document ?? null,
    chunks: chunksQuery.data?.chunksByDocument ?? [],
    loading: documentQuery.loading || chunksQuery.loading,
    error: documentQuery.error ?? chunksQuery.error ?? null,
    refetch: async () => {
      await Promise.all([documentQuery.refetch(), chunksQuery.refetch()]);
    },
  };
}

