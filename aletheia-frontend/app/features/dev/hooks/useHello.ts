/**
 * Example hook for making GraphQL queries
 * Can be enhanced with React 19 use() hook for async data fetching
 */

'use client';

import { useQuery } from '@apollo/client/react';
import { HELLO_QUERY } from '../../../lib/graphql/queries';

interface HelloData {
  hello: string;
}

export function useHello() {
  // Using Apollo Client's useQuery (works well with React 19)
  // For React 19 use() hook, we'd need to refactor to use Suspense
  const { data, loading, error, refetch } = useQuery<HelloData>(HELLO_QUERY, {
    // Skip query if needed
    // skip: !someCondition,
    // React 19: Can use fetchPolicy for better caching
    fetchPolicy: 'cache-first',
  });

  return {
    hello: data?.hello,
    loading,
    error,
    refetch,
  };
}
