/**
 * SelectedDocumentHeaderQueryContainer
 *
 * Exists to strictly map one UI container to one GraphQL query:
 * - Query: `DOCUMENT_QUERY`
 */
'use client';

import type { DocumentHeader } from '../hooks/useDocumentChunks';
import { useDocumentHeader } from '../hooks/useDocumentChunks';

export function SelectedDocumentHeaderQueryContainer(props: {
  documentId: string | null;
  children: (state: { document: DocumentHeader | null; loading: boolean; error: Error | null }) => React.ReactNode;
}) {
  const { documentId, children } = props;
  const q = useDocumentHeader(documentId);
  return children({ document: q.document, loading: q.loading, error: q.error });
}

