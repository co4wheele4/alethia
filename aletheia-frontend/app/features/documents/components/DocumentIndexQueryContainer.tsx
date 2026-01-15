/**
 * DocumentIndexQueryContainer
 *
 * Exists to strictly map one UI container to one GraphQL query:
 * - Query: `DOCUMENT_INDEX_BY_USER_QUERY`
 *
 * It does not contain business logic; it only fetches and exposes query state.
 */
'use client';

import type { DocumentIndexItem } from '../hooks/useDocumentIndex';
import { useDocumentIndex } from '../hooks/useDocumentIndex';

export function DocumentIndexQueryContainer(props: {
  userId: string | null;
  children: (state: {
    documents: DocumentIndexItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
  }) => React.ReactNode;
}) {
  const { userId, children } = props;
  const q = useDocumentIndex(userId);

  return children({
    documents: q.documents,
    loading: q.loading,
    error: q.error,
    refetch: async () => q.refetch(),
  });
}

