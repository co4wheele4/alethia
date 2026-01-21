import { renderHook, waitFor } from '@testing-library/react';
import { useEntity } from '../hooks/useEntity';
import { MockedProvider } from '@apollo/client/testing/react';
import { ENTITY_QUERY } from '../graphql';

const mockEntity = {
  id: 'e1',
  name: 'Test Entity',
  type: 'Person',
  mentionCount: 1,
  outgoing: [],
  incoming: [],
  mentions: [
    {
      id: 'm1',
      entityId: 'e1',
      chunkId: 'c1',
      startOffset: 0,
      endOffset: 5,
      excerpt: 'Test',
      chunk: {
        id: 'c1',
        chunkIndex: 0,
        content: 'Test content',
        documentId: 'd1',
        document: {
          id: 'd1',
          title: 'Doc One',
          createdAt: '2023-01-01T00:00:00Z',
          __typename: 'Document'
        },
        __typename: 'DocumentChunk'
      },
      __typename: 'EntityMention'
    }
  ],
  __typename: 'Entity'
};

const mocks = [
  {
    request: {
      query: ENTITY_QUERY,
      variables: { id: 'e1' },
    },
    result: {
      data: {
        entity: mockEntity,
      },
    },
  },
];

describe('useEntity', () => {
  it('should fetch entity details', async () => {
    const { result } = renderHook(() => useEntity('e1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.entity?.name).toBe('Test Entity');
    });
    expect(result.current.entity?.mentions).toHaveLength(1);
  });

  it('should skip if no entityId', () => {
    const { result } = renderHook(() => useEntity(null), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.entity).toBeNull();
  });
});
