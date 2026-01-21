import { renderHook, waitFor } from '@testing-library/react';
import { useAiQueriesByUser } from '../hooks/useAiQueriesByUser';
import { MockedProvider } from '@apollo/client/testing/react';
import { AI_QUERIES_BY_USER_QUERY } from '../graphql';

const mocks = [
  {
    request: {
      query: AI_QUERIES_BY_USER_QUERY,
      variables: {
        userId: 'u1',
      },
    },
    result: {
      data: {
        aiQueriesByUser: [
          {
            __typename: 'AiQuery',
            id: 'q1',
            query: 'Query 1',
            createdAt: '2023-01-01T00:00:00Z',
            results: [
              {
                __typename: 'AiResult',
                id: 'res1',
                score: 0.9,
                answer: 'Answer 1',
              },
            ],
          },
        ],
      },
    },
  },
];

describe('useAiQueriesByUser', () => {
  it('should fetch and return queries', async () => {
    const { result } = renderHook(() => useAiQueriesByUser('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.queries.length).toBe(1);
    expect(result.current.queries[0]?.query).toBe('Query 1');
  });

  it('should skip if no userId', () => {
    const { result } = renderHook(() => useAiQueriesByUser(null), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.queries).toEqual([]);
  });
});
