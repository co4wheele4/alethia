import { useMutation } from '@apollo/client/react';
import {
  PROPOSE_EXTRACTION_MUTATION,
  ACCEPT_SUGGESTION_MUTATION,
  REJECT_SUGGESTION_MUTATION,
} from '../graphql';

export function useExtraction() {
  const [proposeExtraction, { loading: proposing }] = useMutation(PROPOSE_EXTRACTION_MUTATION);
  const [acceptSuggestion, { loading: accepting }] = useMutation(ACCEPT_SUGGESTION_MUTATION);
  const [rejectSuggestion, { loading: rejecting }] = useMutation(REJECT_SUGGESTION_MUTATION);

  return {
    proposeExtraction: async (chunkId: string) => {
      return await proposeExtraction({
        variables: { chunkId },
        refetchQueries: ['ChunksByDocument'],
      });
    },
    acceptSuggestion: async (id: string) => {
      return await acceptSuggestion({
        variables: { id },
        refetchQueries: ['ChunksByDocument'],
      });
    },
    rejectSuggestion: async (id: string) => {
      return await rejectSuggestion({
        variables: { id },
        refetchQueries: ['ChunksByDocument'],
      });
    },
    loading: proposing || accepting || rejecting,
  };
}
