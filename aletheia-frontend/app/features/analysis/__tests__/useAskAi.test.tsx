import { renderHook } from '@testing-library/react';
import { useAskAi } from '../hooks/useAskAi';
import { MockedProvider } from '@apollo/client/testing/react';
import { ASK_AI_MUTATION } from '../graphql';

const mocks = [
  {
    request: {
      query: ASK_AI_MUTATION,
      variables: {
        userId: 'u1',
        query: 'test query',
      },
    },
    result: {
      data: {
        askAi: {
          __typename: 'AiResult',
          id: 'res1',
          score: 0.9,
          answer: 'test answer',
          query: {
            __typename: 'AiQuery',
            id: 'q1',
            query: 'test query',
            createdAt: '2023-01-01T00:00:00Z',
          },
        },
      },
    },
  },
];

describe('useAskAi', () => {
  it('should call mutation and return result', async () => {
    const { result } = renderHook(() => useAskAi(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={true}>
          {children}
        </MockedProvider>
      ),
    });

    const askRes = await result.current.ask('u1', 'test query');
    expect(askRes?.id).toBe('res1');
    expect(askRes?.answer).toBe('test answer');
  });

  it('should return null if mutation result is empty', async () => {
    const { result } = renderHook(() => useAskAi(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[{
          request: {
            query: ASK_AI_MUTATION,
            variables: { userId: 'u1', query: 'test query' },
          },
          result: { data: null },
        }]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    const askRes = await result.current.ask('u1', 'test query');
    expect(askRes).toBeNull();
  });
});
