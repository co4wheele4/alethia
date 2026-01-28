import { act, renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { GraphQLError } from 'graphql';

import { REQUEST_REVIEW_MUTATION } from '@/src/graphql';
import { useRequestReview } from '../hooks/useRequestReview';

describe('useRequestReview', () => {
  it('dedupes identical in-flight requests (double-click safety)', async () => {
    let calls = 0;

    const mocks = [
      {
        request: {
          query: REQUEST_REVIEW_MUTATION,
          variables: { claimId: 'c1', source: 'CLAIM_VIEW', note: null },
        },
        delay: 50,
        result: () => {
          calls += 1;
          return {
            data: {
              requestReview: {
                __typename: 'ReviewRequest',
                id: 'rr1',
                claimId: 'c1',
                requestedAt: '2026-01-01T00:00:00.000Z',
                source: 'CLAIM_VIEW',
                note: null,
                requestedBy: { __typename: 'User', id: 'u1', email: 'u1@example.com', name: null },
              },
            },
          };
        },
      },
    ];

    const { result } = renderHook(() => useRequestReview(), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    let p1: Promise<any>;
    let p2: Promise<any>;
    await act(async () => {
      p1 = result.current.requestReview({ claimId: 'c1', source: 'CLAIM_VIEW', note: null });
      p2 = result.current.requestReview({ claimId: 'c1', source: 'CLAIM_VIEW', note: null });
    });

    await expect(p2!).resolves.toBeNull();
    await expect(p1!).resolves.toMatchObject({ id: 'rr1', claimId: 'c1' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(calls).toBe(1);
  });

  it('maps DUPLICATE_REVIEW_REQUEST to a typed error', async () => {
    const mocks = [
      {
        request: {
          query: REQUEST_REVIEW_MUTATION,
          variables: { claimId: 'c1', source: 'CLAIM_VIEW', note: null },
        },
        result: {
          errors: [new GraphQLError('DUPLICATE_REVIEW_REQUEST', { extensions: { code: 'DUPLICATE_REVIEW_REQUEST' } })],
        },
      },
    ];

    const { result } = renderHook(() => useRequestReview(), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await act(async () => {
      await expect(
        result.current.requestReview({ claimId: 'c1', source: 'CLAIM_VIEW', note: null }),
      ).rejects.toMatchObject({ code: 'DUPLICATE_REVIEW_REQUEST' });
    });

    await waitFor(() => expect(result.current.error?.code).toBe('DUPLICATE_REVIEW_REQUEST'));
  });
});

