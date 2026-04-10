import { renderHook } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';

import { GET_CLAIMS_FOR_COMPARISON_QUERY } from '@/src/graphql';

import { useClaimsForComparison } from '../hooks/useClaimsForComparison';

vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

describe('useClaimsForComparison', () => {
  it('calls the comparison query with cache-and-network and returns empty defaults', () => {
    const refetch = vi.fn();
    vi.mocked(useQuery).mockReturnValue({
      data: { claims: [] },
      loading: false,
      error: undefined,
      refetch,
    } as any);

    const { result } = renderHook(() => useClaimsForComparison());

    expect(useQuery).toHaveBeenCalledWith(GET_CLAIMS_FOR_COMPARISON_QUERY, {
      variables: { limit: 500, offset: 0 },
      fetchPolicy: 'cache-and-network',
    });
    expect(result.current.claims).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.refetch).toBe(refetch);
  });

  it('returns claims when evidence[] is non-empty (grounded)', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        claims: [
          {
            __typename: 'Claim',
            id: 'c1',
            text: 'Claim text',
            status: 'DRAFT',
            createdAt: '2026-01-01T00:00:00.000Z',
            evidence: [
              {
                __typename: 'ClaimEvidence',
                id: 'ev1',
                claimId: 'c1',
                documentId: 'doc_1',
                createdAt: '2026-01-01T00:00:00.000Z',
                mentionIds: ['m1'],
                relationshipIds: [],
              },
            ],
            documents: [],
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useClaimsForComparison());
    expect(result.current.claims).toHaveLength(1);
    expect(result.current.claims[0].id).toBe('c1');
    expect(result.current.error).toBeNull();
  });

  it('fails fast when a claim has empty evidence[]', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        claims: [
          {
            id: 'c_bad',
            evidence: [],
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    } as any);

    expect(() => renderHook(() => useClaimsForComparison())).toThrow(/Claim\(c_bad\).*evidence\[\]/i);
  });

  it('passes through query error as a nullable field', () => {
    const err = new Error('boom');
    vi.mocked(useQuery).mockReturnValue({
      data: { claims: [] },
      loading: false,
      error: err,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useClaimsForComparison());
    expect(result.current.error).toBe(err);
  });
});

