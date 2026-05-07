import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocumentHeader, useChunksByDocument } from '../hooks/useDocumentChunks';
import { MockedProvider } from '@apollo/client/testing/react';
import { DOCUMENT_QUERY, CHUNKS_BY_DOCUMENT_QUERY } from '../graphql';

const mocks = [
  {
    request: {
      query: DOCUMENT_QUERY,
      variables: { id: 'd1' },
    },
    result: {
      data: {
        document: {
          id: 'd1',
          title: 'Test Doc',
          createdAt: '2023-01-01T00:00:00Z',
          sourceType: null,
          sourceLabel: null,
          __typename: 'Document' as const,
        },
      },
    },
  },
  {
    request: {
      query: CHUNKS_BY_DOCUMENT_QUERY,
      variables: { documentId: 'd1' },
    },
    result: {
      data: {
        chunksByDocument: [
          {
            id: 'c1',
            chunkIndex: 0,
            content: 'chunk 0',
            documentId: 'd1',
            mentions: [],
            __typename: 'DocumentChunk',
          },
        ],
      },
    },
  },
];

describe('useDocumentChunks hooks', () => {
  describe('useDocumentHeader', () => {
    it('fetches document header', async () => {
      const { result } = renderHook(() => useDocumentHeader('d1'), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={mocks}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(true);
      await waitFor(() => {
        expect(result.current.document?.title).toBe('Test Doc');
      });
    });

    it('handles null documentId', async () => {
      const { result } = renderHook(() => useDocumentHeader(null), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={[]}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.document).toBeNull();
    });
  });

  describe('useChunksByDocument', () => {
    it('fetches document chunks', async () => {
      const { result } = renderHook(() => useChunksByDocument('d1'), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={mocks}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(true);
      await waitFor(() => {
        expect(result.current.chunks).toHaveLength(1);
        expect(result.current.chunks[0].content).toBe('chunk 0');
      });
    });

    it('handles null documentId', async () => {
      const { result } = renderHook(() => useChunksByDocument(null), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={[]}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.chunks).toEqual([]);
    });
  });

  describe('useDocumentHeader + useChunksByDocument (same view)', () => {
    it('loads document and chunks together under one MockedProvider', async () => {
      const { result } = renderHook(
        () => {
          const header = useDocumentHeader('d1');
          const chunks = useChunksByDocument('d1');
          return {
            document: header.document,
            chunks: chunks.chunks,
            loading: header.loading || chunks.loading,
            refetch: async () => {
              await Promise.all([header.refetch(), chunks.refetch()]);
            },
          };
        },
        {
          wrapper: ({ children }) => (
            <MockedProvider mocks={[...mocks, ...mocks]}>
              {children}
            </MockedProvider>
          ),
        },
      );

      await waitFor(() => {
        expect(result.current.document?.title).toBe('Test Doc');
        expect(result.current.chunks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.refetch();
      });
    });

    it('skips both queries when documentId is null', async () => {
      const { result } = renderHook(
        () => {
          const header = useDocumentHeader(null);
          const chunks = useChunksByDocument(null);
          return {
            document: header.document,
            chunks: chunks.chunks,
            loading: header.loading || chunks.loading,
          };
        },
        {
          wrapper: ({ children }) => (
            <MockedProvider mocks={[]}>
              {children}
            </MockedProvider>
          ),
        },
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.document).toBeNull();
      expect(result.current.chunks).toEqual([]);
    });
  });
});
