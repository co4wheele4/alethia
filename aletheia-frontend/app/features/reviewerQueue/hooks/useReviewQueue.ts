'use client';

import { useQuery } from '@apollo/client/react';

import { REVIEW_QUEUE_QUERY } from '@/src/graphql';

import type { ReviewRequest } from '../types';

export function useReviewQueue() {
  type ReviewQueueData = { reviewQueue: ReviewRequest[] };
  const q = useQuery<ReviewQueueData>(REVIEW_QUEUE_QUERY, { fetchPolicy: 'cache-and-network' });

  const items = q.data?.reviewQueue ?? [];

  return {
    items,
    loading: q.loading,
    error: q.error ?? null,
    refetch: q.refetch,
  };
}

