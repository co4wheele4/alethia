'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { RESPOND_TO_REVIEW_ASSIGNMENT_MUTATION } from '@/src/graphql';

import type { ReviewerResponse, ReviewerResponseType } from '../types';

export type ReviewerResponseErrorCode =
  | 'UNAUTHORIZED'
  | 'ASSIGNMENT_NOT_FOUND'
  | 'NOT_ASSIGNED_REVIEWER'
  | 'DUPLICATE_RESPONSE'
  | 'NETWORK_OR_UNKNOWN'
  | 'UNEXPECTED_ERROR_CODE';

export type ReviewerResponseError =
  | { code: 'UNAUTHORIZED' }
  | { code: 'ASSIGNMENT_NOT_FOUND' }
  | { code: 'NOT_ASSIGNED_REVIEWER' }
  | { code: 'DUPLICATE_RESPONSE' }
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

function toReviewerResponseError(err: unknown): ReviewerResponseError {
  if (isApolloErrorLike(err)) {
    const first = err.graphQLErrors?.[0] ?? err.errors?.[0];
    const gqlCode = first?.extensions?.code;
    if (gqlCode === 'UNAUTHORIZED') return { code: 'UNAUTHORIZED' };
    if (gqlCode === 'ASSIGNMENT_NOT_FOUND') return { code: 'ASSIGNMENT_NOT_FOUND' };
    if (gqlCode === 'NOT_ASSIGNED_REVIEWER') return { code: 'NOT_ASSIGNED_REVIEWER' };
    if (gqlCode === 'DUPLICATE_RESPONSE') return { code: 'DUPLICATE_RESPONSE' };
    if (typeof gqlCode === 'string' && gqlCode) return { code: 'UNEXPECTED_ERROR_CODE', received: gqlCode };
    return { code: 'NETWORK_OR_UNKNOWN', message: err.message };
  }
  return { code: 'NETWORK_OR_UNKNOWN', message: err instanceof Error ? err.message : String(err) };
}

function toReviewerResponseErrorFromGraphQLErrors(errors: unknown): ReviewerResponseError | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors[0] as { extensions?: { code?: unknown } } | null;
  const gqlCode = first?.extensions?.code;
  if (gqlCode === 'UNAUTHORIZED') return { code: 'UNAUTHORIZED' };
  if (gqlCode === 'ASSIGNMENT_NOT_FOUND') return { code: 'ASSIGNMENT_NOT_FOUND' };
  if (gqlCode === 'NOT_ASSIGNED_REVIEWER') return { code: 'NOT_ASSIGNED_REVIEWER' };
  if (gqlCode === 'DUPLICATE_RESPONSE') return { code: 'DUPLICATE_RESPONSE' };
  if (typeof gqlCode === 'string' && gqlCode) return { code: 'UNEXPECTED_ERROR_CODE', received: gqlCode };
  return { code: 'NETWORK_OR_UNKNOWN', message: 'GraphQL error (no code)' };
}

function keyFor(args: { reviewAssignmentId: string; response: ReviewerResponseType; note?: string }) {
  return `${args.reviewAssignmentId}::${args.response}::${args.note ?? ''}`;
}

/**
 * Respond to a review assignment (ADR-016).
 *
 * Safety:
 * - Dedupes identical in-flight submissions.
 * - Surfaces explicit backend error codes (no generic fallback).
 * - Does not (and must not) invoke adjudication or mutate claim lifecycle.
 */
export function useReviewerResponse() {
  const inFlight = useRef(new Set<string>());
  const [lastError, setLastError] = useState<ReviewerResponseError | null>(null);
  const [lastResult, setLastResult] = useState<ReviewerResponse | null>(null);

  type RespondData = { respondToReviewAssignment: ReviewerResponse };
  type RespondVars = { reviewAssignmentId: string; response: ReviewerResponseType; note?: string | null };

  const [mutate, m] = useMutation<RespondData, RespondVars>(RESPOND_TO_REVIEW_ASSIGNMENT_MUTATION, {
    errorPolicy: 'none',
  });

  const respond = useCallback(
    async (args: { reviewAssignmentId: string; response: ReviewerResponseType; note?: string }) => {
      const k = keyFor(args);
      if (inFlight.current.has(k)) return null;

      setLastError(null);
      setLastResult(null);
      inFlight.current.add(k);

      try {
        const res = await mutate({
          variables: {
            reviewAssignmentId: args.reviewAssignmentId,
            response: args.response,
            note: args.note ?? null,
          },
        });

        const mappedFromResult = toReviewerResponseErrorFromGraphQLErrors((res as { errors?: unknown }).errors);
        if (mappedFromResult) {
          setLastError(mappedFromResult);
          throw mappedFromResult;
        }

        const rr = res.data?.respondToReviewAssignment ?? null;
        setLastResult(rr);
        return rr;
      } catch (err) {
        const mapped = toReviewerResponseError(err);
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
      respond,
      loading: m.loading,
      error: lastError,
      result: lastResult,
    }),
    [respond, m.loading, lastError, lastResult],
  );
}

