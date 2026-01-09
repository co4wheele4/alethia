/**
 * Example hook for making GraphQL queries
 */

'use client';

import { useQuery } from '@apollo/client';
import { HELLO_QUERY } from '../lib/graphql/queries';

interface HelloData {
  hello: string;
}

export function useHello() {
  const { data, loading, error, refetch } = useQuery<HelloData>(HELLO_QUERY, {
    // Skip query if needed
    // skip: !someCondition,
  });

  return {
    hello: data?.hello,
    loading,
    error,
    refetch,
  };
}
