/**
 * DeleteDocumentMutationContainer
 *
 * Exists to strictly map one UI container to one GraphQL mutation:
 * - Mutation: `DELETE_DOCUMENT_MUTATION`
 *
 * It provides a deterministic delete action and exposes mutation state.
 */
'use client';

import { useMutation } from '@apollo/client/react';

import { DELETE_DOCUMENT_MUTATION } from '../graphql';

type DeleteDocumentData = {
  deleteDocument: { __typename?: 'Document'; id: string };
};
type DeleteDocumentVars = {
  id: string;
};

export function DeleteDocumentMutationContainer(props: {
  children: (state: {
    busy: boolean;
    error: Error | null;
    deleteDocument: (id: string) => Promise<string | null>;
  }) => React.ReactNode;
}) {
  const { children } = props;
  const [mutate, state] = useMutation<DeleteDocumentData, DeleteDocumentVars>(DELETE_DOCUMENT_MUTATION);

  return children({
    busy: state.loading,
    error: state.error ?? null,
    deleteDocument: async (id: string) => {
      try {
        const res = await mutate({ variables: { id } });
        return res.data?.deleteDocument?.id ?? null;
      } catch {
        // useMutation state.error will be updated automatically
        return null;
      }
    },
  });
}

