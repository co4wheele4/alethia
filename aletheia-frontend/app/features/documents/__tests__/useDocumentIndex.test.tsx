import { renderHook, waitFor } from '@testing-library/react';
import { useDocumentIndex } from '../hooks/useDocumentIndex';
import { MockedProvider } from '@apollo/client/testing/react';
import { DOCUMENT_INDEX_BY_USER_QUERY } from '../graphql';

const mockDocs = [
  {
    __typename: 'Document',
    id: 'd1',
    title: 'Doc 1',
    createdAt: '2023-01-01T12:00:00Z',
    chunks: [
      {
        __typename: 'DocumentChunk',
        id: 'c1',
        chunkIndex: 0,
        mentions: [
          {
            __typename: 'EntityMention',
            id: 'm1',
            entity: { __typename: 'Entity', id: 'e1', name: 'E1', type: 'Person', mentionCount: 0 }
          }
        ]
      }
    ]
  }
];

const mocks = [
  {
    request: {
      query: DOCUMENT_INDEX_BY_USER_QUERY,
      variables: { userId: 'u1' },
    },
    result: {
      data: {
        documentsByUser: mockDocs,
      },
    },
  },
];

describe('useDocumentIndex', () => {
  it('fetches and computes index items', async () => {
    const { result } = renderHook(() => useDocumentIndex('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.documents.length).toBeGreaterThan(0));
    
    const item = result.current.documents[0];
    expect(item.id).toBe('d1');
    expect(item.chunkCount).toBe(1);
    expect(item.mentionCount).toBe(1);
    expect(item.entityCount).toBe(1);
  });

  it('skips query if no userId', () => {
    const { result } = renderHook(() => useDocumentIndex(null), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.documents).toEqual([]);
  });

  it('handles empty chunks and mentions', async () => {
     const emptyDocs = [
      {
        __typename: 'Document',
        id: 'd2',
        title: 'Empty',
        createdAt: '2023-01-02T12:00:00Z',
        chunks: null
      }
    ];

    const { result } = renderHook(() => useDocumentIndex('u2'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[{
          request: { query: DOCUMENT_INDEX_BY_USER_QUERY, variables: { userId: 'u2' } },
          result: { data: { documentsByUser: emptyDocs } }
        }]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.documents.length).toBeGreaterThan(0));
    expect(result.current.documents[0].chunkCount).toBe(0);
    expect(result.current.documents[0].mentionCount).toBe(0);
  });

  it('handles chunks with null mentions', async () => {
     const docsWithNullMentions = [
      {
        __typename: 'Document',
        id: 'd3',
        title: 'Null Mentions',
        createdAt: '2023-01-03T12:00:00Z',
        chunks: [
          {
            __typename: 'DocumentChunk',
            id: 'c1',
            chunkIndex: 0,
            mentions: null
          }
        ]
      }
    ];

    const { result } = renderHook(() => useDocumentIndex('u3'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[{
          request: { query: DOCUMENT_INDEX_BY_USER_QUERY, variables: { userId: 'u3' } },
          result: { data: { documentsByUser: docsWithNullMentions } }
        }]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.documents.length).toBeGreaterThan(0));
    expect(result.current.documents[0].mentionCount).toBe(0);
  });

  it('handles mentions with missing entity id', async () => {
     const docsWithIncompleteMention = [
      {
        __typename: 'Document',
        id: 'd4',
        title: 'Incomplete Mention',
        createdAt: '2023-01-04T12:00:00Z',
        chunks: [
          {
            __typename: 'DocumentChunk',
            id: 'c1',
            chunkIndex: 0,
            mentions: [
              {
                __typename: 'EntityMention',
                id: 'm1',
                entity: { __typename: 'Entity', id: null, name: 'E1', type: 'Person', mentionCount: 0 }
              }
            ]
          }
        ]
      }
    ];

    const { result } = renderHook(() => useDocumentIndex('u4'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[{
          request: { query: DOCUMENT_INDEX_BY_USER_QUERY, variables: { userId: 'u4' } },
          result: { data: { documentsByUser: docsWithIncompleteMention } }
        }]} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.documents.length).toBeGreaterThan(0));
    expect(result.current.documents[0].entityCount).toBe(0);
  });
});
