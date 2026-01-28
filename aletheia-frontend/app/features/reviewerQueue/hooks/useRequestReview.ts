'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { REQUEST_REVIEW_MUTATION } from '@/src/graphql';

import type { ReviewRequest, ReviewRequestSource } from '../types';

export type RequestReviewErrorCode =
  | 'UNAUTHORIZED'
  | 'CLAIM_NOT_FOUND'
  | 'DUPLICATE_REVIEW_REQUEST'
  | 'NETWORK_OR_UNKNOWN'
  | 'UNEXPECTED_ERROR_CODE';

export type RequestReviewError =
  | { code: 'UNAUTHORIZED' }
  | { code: 'CLAIM_NOT_FOUND' }
  | { code: 'DUPLICATE_REVIEW_REQUEST' }
  | { code: 'UNEXPECTED_ERROR_CODE'; received: string }
  | { code: 'NETWORK_OR_UNKNOWN'; message: string };

function isApolloErrorLike(value: unknown): value is {
  message: string;
  graphQLErrors?: Array<{ extensions?: { code?: unknown } }>;
  errors?: Array<{ extensions?: { code?: unknown } }>;
} {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as { message?: unknown }).message === 'string';
}

function toRequestReviewError(err: unknown): RequestReviewError {
  if (isApolloErrorLike(err)) {
    const first = err.graphQLErrors?.[0] ?? err.errors?.[0];
    const gqlCode = first?.extensions?.code;
    if (gqlCode === 'UNAUTHORIZED') return { code: 'UNAUTHORIZED' };
    if (gqlCode === 'CLAIM_NOT_FOUND') return { code: 'CLAIM_NOT_FOUND' };
    if (gqlCode === 'DUPLICATE_REVIEW_REQUEST') return { code: 'DUPLICATE_REVIEW_REQUEST' };
    if (typeof gqlCode === 'string' && gqlCode) return { code: 'UNEXPECTED_ERROR_CODE', received: gqlCode };
    return { code: 'NETWORK_OR_UNKNOWN', message: err.message };
  }
  return { code: 'NETWORK_OR_UNKNOWN', message: err instanceof Error ? err.message : String(err) };
}

function keyFor(args: { claimId: string; source: ReviewRequestSource }) {
  return `${args.claimId}::${args.source}`;
}

/**
 * Request human review of a claim (coordination-only; does not change claim status).
 *
 * Safety:
 * - Dedupes identical in-flight submissions to prevent double-click duplication.
 * - Surfaces explicit backend error codes.
 */
export function useRequestReview() {
  const inFlight = useRef(new Set<string>());
  const [lastError, setLastError] = useState<RequestReviewError | null>(null);
  const [lastResult, setLastResult] = useState<ReviewRequest | null>(null);

  type RequestReviewData = { requestReview: ReviewRequest };
  type RequestReviewVars = { claimId: string; source: ReviewRequestSource; note?: string | null };

  const [mutate, m] = useMutation<RequestReviewData, RequestReviewVars>(REQUEST_REVIEW_MUTATION);

  const requestReview = useCallback(
    async (args: { claimId: string; source: ReviewRequestSource; note?: string | null }) => {
      const k = keyFor(args);
      if (inFlight.current.has(k)) return null;

      setLastError(null);
      setLastResult(null);
      inFlight.current.add(k);

      try {
        const res = await mutate({
          variables: { claimId: args.claimId, source: args.source, note: args.note ?? null },
        });
        const rr = res.data?.requestReview ?? null;
        setLastResult(rr);
        return rr;
      } catch (err) {
        const mapped = toRequestReviewError(err);
        setLastError(mapped);
        throw mapped;
      } finally {
        inFlight.current.delete(k);
      }
    },
    [mutate],
  );

  return useMemo(
    () => ({
      requestReview,
      loading: m.loading,
      error: lastError,
      result: lastResult,
    }),
    [requestReview, m.loading, lastError, lastResult],
  );
}

