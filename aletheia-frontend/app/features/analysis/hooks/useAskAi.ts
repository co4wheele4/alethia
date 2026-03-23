'use client';

import { useMutation } from '@apollo/client/react';

import { ASK_AI_MUTATION } from '../graphql';

export type AiQueryHeader = {
  __typename?: 'AiQuery';
  id: string;
  query: string;
  createdAt: string;
};

export type AiQueryResult = {
  __typename?: 'AiQueryResult';
  id: string;
  answer: string;
  query: AiQueryHeader;
};

type AskAiData = {
  askAi: AiQueryResult;
};

type AskAiVars = {
  userId: string;
  query: string;
};

export function useAskAi() {
  const [mutate, state] = useMutation<AskAiData, AskAiVars>(ASK_AI_MUTATION);

  return {
    ask: async (userId: string, query: string) => {
      const res = await mutate({ variables: { userId, query } });
      return res.data?.askAi ?? null;
    },
    loading: state.loading,
    error: state.error ?? null,
  };
}

