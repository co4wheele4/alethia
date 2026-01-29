'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { ASSIGN_REVIEWER_MUTATION } from '@/src/graphql';

import type { ReviewAssignment } from '../types';

export type AssignReviewerErrorCode =
  | 'UNAUTHORIZED'
  | 'REVIEW_REQUEST_NOT_FOUND'
  | 'REVIEWER_NOT_ELIGIBLE'
  | 'DUPLICATE_ASSIGNMENT'
  | 'NETWORK_OR_UNKNOWN'
  | 'UNEXPECTED_ERROR_CODE';

export type AssignReviewerError =
  | { code: 'UNAUTHORIZED' }
  | { code: 'REVIEW_REQUEST_NOT_FOUND' }
  | { code: 'REVIEWER_NOT_ELIGIBLE' }
  | { code: 'DUPLICATE_ASSIGNMENT' }
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

function toAssignReviewerError(err: unknown): AssignReviewerError {
  if (isApolloErrorLike(err)) {
    const first = err.graphQLErrors?.[0] ?? err.errors?.[0];
    const gqlCode = first?.extensions?.code;
    if (gqlCode === 'UNAUTHORIZED') return { code: 'UNAUTHORIZED' };
    if (gqlCode === 'REVIEW_REQUEST_NOT_FOUND') return { code: 'REVIEW_REQUEST_NOT_FOUND' };
    if (gqlCode === 'REVIEWER_NOT_ELIGIBLE') return { code: 'REVIEWER_NOT_ELIGIBLE' };
    if (gqlCode === 'DUPLICATE_ASSIGNMENT') return { code: 'DUPLICATE_ASSIGNMENT' };
    if (typeof gqlCode === 'string' && gqlCode) return { code: 'UNEXPECTED_ERROR_CODE', received: gqlCode };
    return { code: 'NETWORK_OR_UNKNOWN', message: err.message };
  }
  return { code: 'NETWORK_OR_UNKNOWN', message: err instanceof Error ? err.message : String(err) };
}

function toAssignReviewerErrorFromGraphQLErrors(errors: unknown): AssignReviewerError | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors[0] as { extensions?: { code?: unknown } } | null;
  const gqlCode = first?.extensions?.code;
  if (gqlCode === 'UNAUTHORIZED') return { code: 'UNAUTHORIZED' };
  if (gqlCode === 'REVIEW_REQUEST_NOT_FOUND') return { code: 'REVIEW_REQUEST_NOT_FOUND' };
  if (gqlCode === 'REVIEWER_NOT_ELIGIBLE') return { code: 'REVIEWER_NOT_ELIGIBLE' };
  if (gqlCode === 'DUPLICATE_ASSIGNMENT') return { code: 'DUPLICATE_ASSIGNMENT' };
  if (typeof gqlCode === 'string' && gqlCode) return { code: 'UNEXPECTED_ERROR_CODE', received: gqlCode };
  return { code: 'NETWORK_OR_UNKNOWN', message: 'GraphQL error (no code)' };
}

function keyFor(args: { reviewRequestId: string; reviewerUserId: string }) {
  return `${args.reviewRequestId}::${args.reviewerUserId}`;
}

/**
 * Assign a reviewer (coordination-only).
 *
 * Safety:
 * - Dedupes identical in-flight submissions to prevent double-click duplication.
 * - Surfaces explicit backend error codes.
 */
export function useAssignReviewer() {
  const inFlight = useRef(new Set<string>());
  const [lastError, setLastError] = useState<AssignReviewerError | null>(null);
  const [lastResult, setLastResult] = useState<ReviewAssignment | null>(null);

  type AssignReviewerData = { assignReviewer: ReviewAssignment };
  type AssignReviewerVars = { reviewRequestId: string; reviewerUserId: string };

  const [mutate, m] = useMutation<AssignReviewerData, AssignReviewerVars>(ASSIGN_REVIEWER_MUTATION, {
    // For this coordination-only surface we want explicit, catchable backend error codes.
    // The app-wide default is `errorPolicy: 'all'`, which would otherwise suppress throws.
    errorPolicy: 'none',
  });

  const assignReviewer = useCallback(
    async (args: { reviewRequestId: string; reviewerUserId: string }) => {
      const k = keyFor(args);
      if (inFlight.current.has(k)) return null;

      setLastError(null);
      setLastResult(null);
      inFlight.current.add(k);

      try {
        const res = await mutate({ variables: { ...args } });

        // Apollo is configured with `errorPolicy: 'all'` for mutations, so GraphQL errors can arrive
        // on the result without throwing. We must still surface explicit backend error codes.
        const mappedFromResult = toAssignReviewerErrorFromGraphQLErrors((res as { errors?: unknown }).errors);
        if (mappedFromResult) {
          setLastError(mappedFromResult);
          throw mappedFromResult;
        }

        const ra = res.data?.assignReviewer ?? null;
        setLastResult(ra);
        return ra;
      } catch (err) {
        const mapped = toAssignReviewerError(err);
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
      assignReviewer,
      loading: m.loading,
      error: lastError,
      result: lastResult,
    }),
    [assignReviewer, m.loading, lastError, lastResult],
  );
}

