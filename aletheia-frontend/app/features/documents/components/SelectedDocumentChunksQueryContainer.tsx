/**
 * SelectedDocumentChunksQueryContainer
 *
 * Exists to strictly map one UI container to one GraphQL query:
 * - Query: `CHUNKS_BY_DOCUMENT_QUERY`
 */
'use client';

import type { DocumentChunkItem } from '../hooks/useDocumentChunks';
import { useChunksByDocument } from '../hooks/useDocumentChunks';

export function SelectedDocumentChunksQueryContainer(props: {
  documentId: string | null;
  children: (state: { chunks: DocumentChunkItem[]; loading: boolean; error: Error | null }) => React.ReactNode;
}) {
  const { documentId, children } = props;
  const q = useChunksByDocument(documentId);
  return children({ chunks: q.chunks, loading: q.loading, error: q.error });
}

