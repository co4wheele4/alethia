'use client';

import { useMutation } from '@apollo/client/react';
import { useCallback, useMemo, useState } from 'react';

import { ADJUDICATE_CLAIM_MUTATION } from '@/src/graphql';

export type ClaimLifecycleState = 'DRAFT' | 'REVIEW' | 'ACCEPTED' | 'REJECTED';

export type AdjudicateClaimErrorCode =
  | 'UNAUTHORIZED_REVIEWER'
  | 'CLAIM_NOT_FOUND'
  | 'INVALID_LIFECYCLE_TRANSITION';

export type AdjudicateClaimError =
  | { code: 'UNAUTHORIZED_REVIEWER' }
  | { code: 'CLAIM_NOT_FOUND' }
  | { code: 'INVALID_LIFECYCLE_TRANSITION' }
  | { code: 'UNEXPECTED_ERROR_CODE'; received: string }
  | { code: 'NETWORK_OR_UNKNOWN'; message: string };

type AdjudicateClaimResult = {
  adjudicateClaim: {
    __typename?: 'Claim';
    id: string;
    status: 'DRAFT' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    reviewerNote?: string | null;
  };
};

type AdjudicateClaimVars = {
  claimId: string;
  decision: ClaimLifecycleState;
  reviewerNote?: string | null;
};

function readGraphqlErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const extensions = (err as { extensions?: unknown }).extensions;
  if (!extensions || typeof extensions !== 'object') return null;
  const code = (extensions as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function isKnownAdjudicationCode(code: string): code is AdjudicateClaimErrorCode {
  return (
    code === 'UNAUTHORIZED_REVIEWER' ||
    code === 'CLAIM_NOT_FOUND' ||
    code === 'INVALID_LIFECYCLE_TRANSITION'
  );
}

export function useAdjudicateClaim(claimId: string) {
  const [mutate, { loading }] = useMutation<AdjudicateClaimResult, AdjudicateClaimVars>(
    ADJUDICATE_CLAIM_MUTATION,
    { errorPolicy: 'all' }
  );

  const [error, setError] = useState<AdjudicateClaimError | null>(null);

  const adjudicate = useCallback(
    async (decision: ClaimLifecycleState, reviewerNote?: string | null) => {
      setError(null);

      try {
        const res = await mutate({
          variables: {
            claimId,
            decision,
            reviewerNote: reviewerNote ?? null,
          },
        });

        const graphQLErr = (res as { errors?: unknown[] } | null | undefined)?.errors?.[0];
        if (graphQLErr) {
          const code = readGraphqlErrorCode(graphQLErr);
          if (code && isKnownAdjudicationCode(code)) {
            const mapped: AdjudicateClaimError = { code };
            setError(mapped);
            return null;
          }
          if (code) {
            const mapped: AdjudicateClaimError = { code: 'UNEXPECTED_ERROR_CODE', received: code };
            setError(mapped);
            return null;
          }

          const message =
            (graphQLErr as { message?: unknown } | null | undefined)?.message ??
            'GraphQL error without message.';
          const mapped: AdjudicateClaimError = {
            code: 'NETWORK_OR_UNKNOWN',
            message: typeof message === 'string' ? message : String(message),
          };
          setError(mapped);
          return null;
        }

        const updated = res.data?.adjudicateClaim ?? null;
        if (!updated) {
          const mapped: AdjudicateClaimError = {
            code: 'NETWORK_OR_UNKNOWN',
            message: 'Mutation succeeded but no claim was returned.',
          };
          setError(mapped);
          return null;
        }

        return updated;
      } catch (err) {
        const gqlErr =
          err && typeof err === 'object' && 'graphQLErrors' in err
            ? ((err as { graphQLErrors?: unknown[] }).graphQLErrors?.[0] ?? null)
            : null;
        const code = gqlErr ? readGraphqlErrorCode(gqlErr) : null;

        if (code && isKnownAdjudicationCode(code)) {
          const mapped: AdjudicateClaimError = { code };
          setError(mapped);
          return null;
        }
        if (code) {
          const mapped: AdjudicateClaimError = { code: 'UNEXPECTED_ERROR_CODE', received: code };
          setError(mapped);
          return null;
        }

        const message = err instanceof Error ? err.message : String(err);
        const mapped: AdjudicateClaimError = { code: 'NETWORK_OR_UNKNOWN', message };
        setError(mapped);
        return null;
      }
    },
    [claimId, mutate]
  );

  return useMemo(
    () => ({
      adjudicate,
      loading,
      error,
    }),
    [adjudicate, error, loading]
  );
}

