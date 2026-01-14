'use client';

import { useQuery } from '@apollo/client/react';

import { ENTITIES_QUERY } from '../graphql';

export type EntityListItem = {
  __typename?: 'Entity';
  id: string;
  name: string;
  type: string;
};

type EntitiesData = {
  entities: EntityListItem[];
};

export function useEntities() {
  const query = useQuery<EntitiesData>(ENTITIES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    entities: query.data?.entities ?? [],
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

