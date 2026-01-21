import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocumentHeader, useChunksByDocument, useDocumentDetails } from '../hooks/useDocumentChunks';
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
        document: { id: 'd1', title: 'Test Doc', createdAt: '2023-01-01T00:00:00Z', __typename: 'Document' },
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
            aiSuggestions: [],
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
          <MockedProvider mocks={mocks} addTypename={true}>
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
          <MockedProvider mocks={[]} addTypename={true}>
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
          <MockedProvider mocks={mocks} addTypename={true}>
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
          <MockedProvider mocks={[]} addTypename={true}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.chunks).toEqual([]);
    });
  });

  describe('useDocumentDetails', () => {
    it('fetches both (deprecated)', async () => {
      const { result } = renderHook(() => useDocumentDetails('d1'), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={[...mocks, ...mocks]} addTypename={true}>
            {children}
          </MockedProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.document?.title).toBe('Test Doc');
        expect(result.current.chunks).toHaveLength(1);
      });

      // Test refetch
      await act(async () => {
        await result.current.refetch();
      });
    });

    it('handles null documentId', async () => {
      const { result } = renderHook(() => useDocumentDetails(null), {
        wrapper: ({ children }) => (
          <MockedProvider mocks={[]} addTypename={true}>
            {children}
          </MockedProvider>
        ),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.document).toBeNull();
      expect(result.current.chunks).toEqual([]);
    });
  });
});
