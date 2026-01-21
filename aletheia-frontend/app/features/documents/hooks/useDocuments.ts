/**
 * Documents data hook
 *
 * Separates data-fetching + mutations from UI components.
 * Uses Apollo cache updates intentionally for a snappy, deterministic UX.
 */
'use client';

import { useCallback, useMemo } from 'react';
import type { ApolloCache } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_DOCUMENT_MUTATION,
  DELETE_DOCUMENT_MUTATION,
  DOCUMENTS_BY_USER_QUERY,
} from '../graphql';

export type DocumentListItem = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
};

type DocumentsByUserData = {
  documentsByUser: DocumentListItem[];
};

type DocumentsByUserVars = {
  userId: string;
};

type CreateDocumentData = {
  createDocument: DocumentListItem;
};

type CreateDocumentVars = {
  title: string;
  userId: string;
};

type DeleteDocumentData = {
  deleteDocument: { __typename?: 'Document'; id: string };
};

type DeleteDocumentVars = {
  id: string;
};

function upsertIntoDocumentsByUser(
  cache: ApolloCache,
  userId: string,
  doc: DocumentListItem
) {
  const normalizedDoc: DocumentListItem = {
    ...doc,
    __typename: doc.__typename ?? 'Document',
  };

  cache.updateQuery<DocumentsByUserData, DocumentsByUserVars>(
    { query: DOCUMENTS_BY_USER_QUERY, variables: { userId } },
    (existing) => {
      const prev = existing?.documentsByUser || [];
      const already = prev.some((d) => d.id === normalizedDoc.id);
      if (already) return existing;
      return { documentsByUser: [...prev, normalizedDoc] };
    }
  );
}

function removeFromDocumentsByUser(cache: ApolloCache, userId: string, id: string) {
  cache.updateQuery<DocumentsByUserData, DocumentsByUserVars>(
    { query: DOCUMENTS_BY_USER_QUERY, variables: { userId } },
    (existing) => {
      const prev = existing?.documentsByUser || [];
      return { documentsByUser: prev.filter((d) => d.id !== id) };
    }
  );

  cache.evict({
    id: cache.identify({
      __typename: 'Document',
      id,
    }),
  });
  cache.gc();
}

export function useDocuments(userId: string | null) {
  // Some views only need document mutations (delete/create) and use a separate index query.
  // Keep this opt-in to avoid duplicate network traffic.
  const skipList = false;
  return useDocumentsInternal(userId, { skipList });
}

export function useDocumentsInternal(
  userId: string | null,
  opts?: {
    /**
     * If true, skip the DocumentsByUser list query. Mutations still work.
     */
    skipList?: boolean;
  }
) {
  const skipList = Boolean(opts?.skipList);
  const variables = useMemo(() => ({ userId: userId ?? '' }), [userId]);

  const query = useQuery<DocumentsByUserData, DocumentsByUserVars>(DOCUMENTS_BY_USER_QUERY, {
    variables,
    skip: !userId || skipList,
    fetchPolicy: 'cache-and-network',
  });

  const [createDocumentMutation, createState] = useMutation<CreateDocumentData, CreateDocumentVars>(
    CREATE_DOCUMENT_MUTATION
  );
  const [deleteDocumentMutation, deleteState] = useMutation<DeleteDocumentData, DeleteDocumentVars>(
    DELETE_DOCUMENT_MUTATION
  );

  const createDocument = useCallback(
    async (title: string) => {
      if (!userId) return;

      const result = await createDocumentMutation({
        variables: { title, userId },
        update: (cache, result) => {
          const doc = result.data?.createDocument;
          if (!doc) return;
          upsertIntoDocumentsByUser(cache, userId, doc);
        },
        // Refetch to ensure authoritative server state (createdAt, ordering, etc.)
        refetchQueries: [{ query: DOCUMENTS_BY_USER_QUERY, variables: { userId } }],
        awaitRefetchQueries: true,
      });

      return result.data?.createDocument ?? null;
    },
    [createDocumentMutation, userId]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!userId) return;

      const result = await deleteDocumentMutation({
        variables: { id },
        update: (cache, result) => {
          const deletedId = result.data?.deleteDocument?.id ?? id;
          removeFromDocumentsByUser(cache, userId, deletedId);
        },
        // Refetch for consistency in case of server-side logic.
        refetchQueries: [{ query: DOCUMENTS_BY_USER_QUERY, variables: { userId } }],
        awaitRefetchQueries: true,
      });

      return result.data?.deleteDocument?.id ?? id;
    },
    [deleteDocumentMutation, userId]
  );

  return {
    documents: query.data?.documentsByUser ?? [],
    loading: skipList ? false : query.loading,
    error: query.error ?? createState.error ?? deleteState.error ?? null,
    isBusy: createState.loading || deleteState.loading,
    createDocument,
    deleteDocument,
    refetch: query.refetch,
  };
}

