import { renderHook, waitFor, act } from '@testing-library/react';
import * as ingestModule from '../hooks/useIngestDocuments';
import { MockedProvider } from '@apollo/client/testing/react';
import { DOCUMENTS_BY_USER_QUERY, INGEST_DOCUMENT_MUTATION } from '../graphql';

const FIXED_DATE = '2023-01-01T12:00:00.000Z';

const docFields = {
  __typename: 'Document' as const,
  createdAt: FIXED_DATE,
  sourceType: 'MANUAL',
  sourceLabel: 'Hello world',
};

function ingestMock(input: {
  title: string;
  userId: string;
  content: string;
  source: Record<string, unknown>;
  id: string;
  chunkIds: string[];
}) {
  return {
    request: {
      query: INGEST_DOCUMENT_MUTATION,
      variables: {
        input: {
          title: input.title,
          userId: input.userId,
          content: input.content,
          source: input.source,
        },
      },
    },
    result: {
      data: {
        ingestDocument: {
          id: input.id,
          title: input.title,
          ...docFields,
          chunks: input.chunkIds.map((id) => ({ __typename: 'DocumentChunk' as const, id })),
        },
      },
    },
  };
}

const baseMocks = [
  ingestMock({
    title: 'Test Doc',
    userId: 'u1',
    content: 'Hello world',
    source: { kind: 'MANUAL' },
    id: 'd1',
    chunkIds: ['c1'],
  }),
  {
    request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
    result: { data: { documentsByUser: [] } },
  },
];

describe('useIngestDocuments', () => {
  it('should orchestrate ingestion via ingestDocument', async () => {
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={baseMocks}>{children}</MockedProvider>,
    });
    let ingestResult: { documentId: string; chunksCreated: number } | null = null;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'Test Doc', text: 'Hello world', source: { kind: 'manual' } });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(ingestResult).toEqual({ documentId: 'd1', chunksCreated: 1 });
  });

  it('should report chunk count from server response', async () => {
    const largeText = 'A'.repeat(2100) + '\n\n' + 'B'.repeat(500);
    const mocks = [
      ingestMock({
        title: 'Large',
        userId: 'u1',
        content: largeText,
        source: { kind: 'MANUAL' },
        id: 'd-large',
        chunkIds: ['c1', 'c2'],
      }),
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];

    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await act(async () => {
      await result.current.ingestOne({ title: 'Large', text: largeText, source: { kind: 'manual' } });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    if (result.current.progress.state === 'done') {
      expect(result.current.progress.chunksCreated).toBe(2);
    }
  });

  it('should handle empty title or text error', async () => {
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });

    let ingestResult: { documentId: string; chunksCreated: number } | null = null;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: '', text: 'Hello', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    if (result.current.progress.state === 'error') {
      expect(result.current.progress.message).toContain('Title is required');
    }

    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'T', text: ' ', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    if (result.current.progress.state === 'error') {
      expect(result.current.progress.message).toContain('No text content');
    }
  });

  it('should handle failed ingestDocument', async () => {
    const failMocks = [
      {
        request: {
          query: INGEST_DOCUMENT_MUTATION,
          variables: {
            input: {
              title: 'Fail',
              userId: 'u1',
              content: 'Hello',
              source: { kind: 'MANUAL' },
            },
          },
        },
        result: { data: { ingestDocument: null } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={failMocks}>{children}</MockedProvider>,
    });

    let ingestResult: { documentId: string; chunksCreated: number } | null = null;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'Fail', text: 'Hello', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    if (result.current.progress.state === 'error') {
      expect(result.current.progress.message).toContain('Failed to ingest');
    }
  });

  it('should handle missing userId', async () => {
    const { result } = renderHook(() => ingestModule.useIngestDocuments(null), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });
    await act(async () => {
      await result.current.ingestOne({ title: 'T', text: 'H', source: { kind: 'manual' } });
    });
    expect(result.current.progress.state).toBe('error');
  });

  it('should handle file source', async () => {
    const fileSource = {
      kind: 'file' as const,
      filename: 't.txt',
      mimeType: 'text/plain',
      sizeBytes: 10,
      lastModifiedMs: 0,
      provenanceConfirmed: true,
    };
    const gqlSource = {
      kind: 'FILE',
      filename: 't.txt',
      mimeType: 'text/plain',
      sizeBytes: 10,
      lastModifiedMs: '0',
      fileSha256: undefined,
    };
    const fileMocks = [
      ingestMock({
        title: 'F',
        userId: 'u1',
        content: 'H',
        source: gqlSource,
        id: 'd2',
        chunkIds: ['c2'],
      }),
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={fileMocks}>{children}</MockedProvider>,
    });
    await act(async () => {
      await result.current.ingestOne({ title: 'F', text: 'H', source: fileSource });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
  });

  it('should handle URL source', async () => {
    const urlSource = { kind: 'url' as const, url: 'https://e.c', accessedAtIso: FIXED_DATE, provenanceConfirmed: false };
    const gqlSource = {
      kind: 'URL',
      requestedUrl: 'https://e.c',
      accessedAt: FIXED_DATE,
    };
    const urlMocks = [
      ingestMock({
        title: 'U',
        userId: 'u1',
        content: 'H',
        source: gqlSource,
        id: 'd3',
        chunkIds: ['c3'],
      }),
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={urlMocks}>{children}</MockedProvider>,
    });
    await act(async () => {
      await result.current.ingestOne({ title: 'U', text: 'H', source: urlSource });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
  });

  it('splitIntoChunks should return empty array for empty text', () => {
    expect(ingestModule.splitIntoChunks('')).toEqual([]);
    expect(ingestModule.splitIntoChunks('   ')).toEqual([]);
  });

  it('splitIntoChunks should handle small text', () => {
    expect(ingestModule.splitIntoChunks('Hello')).toEqual(['Hello']);
  });

  it('should handle reset', () => {
    const { result } = renderHook(() => ingestModule.useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.progress.state).toBe('idle');
  });
});
