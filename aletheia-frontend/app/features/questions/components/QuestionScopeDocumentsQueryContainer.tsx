/**
 * QuestionScopeDocumentsQueryContainer
 *
 * Exists to strictly map one UI container to one GraphQL query:
 * - Query: `DOCUMENTS_BY_USER_QUERY`
 *
 * Used by the Question Workspace to list selectable scope documents.
 */
'use client';

import type { DocumentListItem } from '../../documents/hooks/useDocuments';
import { useDocuments } from '../../documents/hooks/useDocuments';

export function QuestionScopeDocumentsQueryContainer(props: {
  userId: string | null;
  children: (state: { documents: DocumentListItem[]; loading: boolean; error: Error | null }) => React.ReactNode;
}) {
  const { userId, children } = props;
  const q = useDocuments(userId);
  return children({ documents: q.documents, loading: q.loading, error: q.error });
}

