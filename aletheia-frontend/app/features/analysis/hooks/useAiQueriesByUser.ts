'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { AI_QUERIES_BY_USER_QUERY } from '../graphql';

export type AiQueryResultItem = {
  __typename?: 'AiQueryResult';
  id: string;
  answer: string;
};

export type AiQueryItem = {
  __typename?: 'AiQuery';
  id: string;
  query: string;
  createdAt: string;
  results: AiQueryResultItem[];
};

type Data = {
  aiQueriesByUser: AiQueryItem[];
};

type Vars = {
  userId: string;
};

export function useAiQueriesByUser(userId: string | null) {
  const vars = useMemo(() => ({ userId: userId ?? '' }), [userId]);
  const query = useQuery<Data, Vars>(AI_QUERIES_BY_USER_QUERY, {
    variables: vars,
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    queries: query.data?.aiQueriesByUser ?? [],
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

