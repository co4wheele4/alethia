'use client';

import { useQuery } from '@apollo/client/react';

import { REVIEW_REQUESTS_BY_CLAIM_QUERY } from '@/src/graphql';
import type { ReviewRequest } from '../../reviewerQueue/types';

export function useReviewActivityForClaim(claimId: string | null) {
  type ReviewRequestsByClaimData = { reviewRequestsByClaim: ReviewRequest[] };
  type ReviewRequestsByClaimVars = { claimId: string };

  const q = useQuery<ReviewRequestsByClaimData, ReviewRequestsByClaimVars>(REVIEW_REQUESTS_BY_CLAIM_QUERY, {
    // Apollo's TS overloads require `variables` to match the Vars generic even when `skip` is true.
    variables: { claimId: claimId ?? '' },
    skip: !claimId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    items: q.data?.reviewRequestsByClaim ?? [],
    loading: q.loading,
    error: q.error ?? null,
    refetch: q.refetch,
  };
}

