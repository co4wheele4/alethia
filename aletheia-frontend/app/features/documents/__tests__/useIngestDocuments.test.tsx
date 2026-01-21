import { renderHook, waitFor, act } from '@testing-library/react';
import { useIngestDocuments, splitIntoChunks } from '../hooks/useIngestDocuments';
import { MockedProvider } from '@apollo/client/testing/react';
import { CREATE_CHUNK_MUTATION, CREATE_DOCUMENT_MUTATION, DOCUMENTS_BY_USER_QUERY } from '../graphql';
import { vi } from 'vitest';

const FIXED_DATE = '2023-01-01T12:00:00.000Z';
const JSON_DATE = JSON.stringify(FIXED_DATE);
const EXPECTED_CONTENT = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: \ningestedAt: ${JSON_DATE}\ncontentSha256: 0000000000000000000000000000000000000000000000000000000000000000\n---\nHello world`;

const mocks = [
  {
    request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Test Doc' } },
    result: { data: { createDocument: { id: 'd1', title: 'Test Doc', createdAt: FIXED_DATE, __typename: 'Document' } } },
  },
  {
    request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd1', chunkIndex: 0, content: EXPECTED_CONTENT } },
    result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd1', __typename: 'DocumentChunk' } } },
  },
  {
    request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
    result: { data: { documentsByUser: [] } },
  },
];

describe('useIngestDocuments', () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_DATE);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('should orchestrate ingestion', async () => {
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      ),
    });
    let ingestResult: { documentId: string; chunksCreated: number } | null = null;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'Test Doc', text: 'Hello world', source: { kind: 'manual' } });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect((ingestResult as any)?.documentId).toBe('d1');
  });

  it('should split large text into chunks with paragraph breaks', async () => {
    const largeText = 'A'.repeat(2100) + '\n\n' + 'B'.repeat(500);
    const contentSha256 = '0000000000000000000000000000000000000000000000000000000000000000';
    const header = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: \ningestedAt: ${JSON_DATE}\ncontentSha256: ${contentSha256}\n---\n`;
    const chunk0 = `${header}${'A'.repeat(2100)}`;
    const chunk1 = 'B'.repeat(500);

    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[
          {
            request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Large' } },
            result: { data: { createDocument: { id: 'd-large', title: 'Large', createdAt: FIXED_DATE, __typename: 'Document' } } },
          },
          {
            request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd-large', chunkIndex: 0, content: chunk0 } },
            result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd-large', __typename: 'DocumentChunk' } } },
          },
          {
            request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd-large', chunkIndex: 1, content: chunk1 } },
            result: { data: { createChunk: { id: 'c2', chunkIndex: 1, content: '...', documentId: 'd-large', __typename: 'DocumentChunk' } } },
          },
          {
            request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
            result: { data: { documentsByUser: [] } },
          }
        ]}>{children}</MockedProvider>
      ),
    });

    await act(async () => {
      await result.current.ingestOne({ title: 'Large', text: largeText, source: { kind: 'manual' } });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(result.current.progress.state).toBe('done');
    if (result.current.progress.state === 'done') {
      expect(result.current.progress.chunksCreated).toBe(2);
    }
  });

  it('should handle empty title or text error', async () => {
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });
    
    // Empty title
    let ingestResult;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: '', text: 'Hello', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    expect((result.current.progress as any).message).toContain('Title is required');

    // Empty text
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'T', text: ' ', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    expect((result.current.progress as any).message).toContain('No text content');
  });

  it('should handle failed document creation', async () => {
    const failMocks = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Fail' } },
        result: { data: { createDocument: null } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      }
    ];
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={failMocks}>{children}</MockedProvider>,
    });
    
    let ingestResult;
    await act(async () => {
      ingestResult = await result.current.ingestOne({ title: 'Fail', text: 'Hello', source: { kind: 'manual' } });
    });
    expect(ingestResult).toBeNull();
    expect(result.current.progress.state).toBe('error');
    expect((result.current.progress as any).message).toContain('Failed to create document');
  });

  it('should handle missing userId', async () => {
    const { result } = renderHook(() => useIngestDocuments(null), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });
    await act(async () => { await result.current.ingestOne({ title: 'T', text: 'H', source: { kind: 'manual' } }); });
    expect(result.current.progress.state).toBe('error');
  });

  it('should handle file source and boolean provenance', async () => {
    const fileSource = {
      kind: 'file' as const, filename: 't.txt', mimeType: 'text/plain', sizeBytes: 10, lastModifiedMs: 0,
      provenanceConfirmed: true,
    };
    const content = `---\nsource:\n  kind: file\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: true\n  filename: t.txt\n  mimeType: text/plain\n  sizeBytes: 10\n  lastModifiedMs: 0\n  fileSha256: \ningestedAt: ${JSON_DATE}\ncontentSha256: 0000000000000000000000000000000000000000000000000000000000000000\n---\nH`;
    const fileMocks = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'F' } },
        result: { data: { createDocument: { id: 'd2', title: 'F', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd2', chunkIndex: 0, content: content } },
        result: { data: { createChunk: { id: 'c2', chunkIndex: 0, content: '...', documentId: 'd2', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={fileMocks}>{children}</MockedProvider>,
    });
    await act(async () => { await result.current.ingestOne({ title: 'F', text: 'H', source: fileSource }); });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(result.current.progress.state).toBe('done');
  });

  it('should handle URL source', async () => {
    const urlSource = { kind: 'url' as const, url: 'h://e.c', accessedAtIso: FIXED_DATE, provenanceConfirmed: false };
    const content = `---\nsource:\n  kind: url\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: false\n  url: "h://e.c"\n  fetchedUrl: \n  contentType: \n  publisher: \n  author: \n  publishedAt: \n  accessedAt: ${JSON_DATE}\ningestedAt: ${JSON_DATE}\ncontentSha256: 0000000000000000000000000000000000000000000000000000000000000000\n---\nH`;
    const urlMocks = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'U' } },
        result: { data: { createDocument: { id: 'd3', title: 'U', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd3', chunkIndex: 0, content: content } },
        result: { data: { createChunk: { id: 'c3', chunkIndex: 0, content: '...', documentId: 'd3', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={urlMocks}>{children}</MockedProvider>,
    });
    await act(async () => { await result.current.ingestOne({ title: 'U', text: 'H', source: urlSource }); });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(result.current.progress.state).toBe('done');
  });

  it('should handle sha256 error', async () => {
    const originalSubtle = globalThis.crypto.subtle;
    const errorExpectedContent = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: \ningestedAt: ${JSON_DATE}\ncontentSha256: \n---\nHello world`;
    const errorMocks = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Test Doc' } },
        result: { data: { createDocument: { id: 'd1', title: 'Test Doc', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd1', chunkIndex: 0, content: errorExpectedContent } },
        result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd1', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];

    try {
      // @ts-expect-error - mocking missing API
      globalThis.crypto.subtle = { digest: () => Promise.reject(new Error('fail')) };
      const { result } = renderHook(() => useIngestDocuments('u1'), {
        wrapper: ({ children }) => <MockedProvider mocks={errorMocks}>{children}</MockedProvider>,
      });
      let ingestResult: { documentId: string; chunksCreated: number } | null = null;
      await act(async () => {
        ingestResult = await result.current.ingestOne({ title: 'Test Doc', text: 'Hello world', source: { kind: 'manual' } });
      });
      await waitFor(() => expect(result.current.progress.state).toBe('done'));
      expect((ingestResult as any)?.documentId).toBe('d1');
    } finally {
      // @ts-expect-error - restoring API
      globalThis.crypto.subtle = originalSubtle;
    }
  });

  it('should handle missing crypto.subtle', async () => {
    const errorExpectedContent = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: \ningestedAt: ${JSON_DATE}\ncontentSha256: \n---\nHello world`;
    const errorMocks = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Test Doc' } },
        result: { data: { createDocument: { id: 'd1', title: 'Test Doc', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd1', chunkIndex: 0, content: errorExpectedContent } },
        result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd1', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];

    try {
      vi.stubGlobal('crypto', { subtle: undefined });
      const { result } = renderHook(() => useIngestDocuments('u1'), {
        wrapper: ({ children }) => <MockedProvider mocks={errorMocks}>{children}</MockedProvider>,
      });
      await act(async () => {
        await result.current.ingestOne({ title: 'Test Doc', text: 'Hello world', source: { kind: 'manual' } });
      });
      await waitFor(() => expect(result.current.progress.state).toBe('done'));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('splitIntoChunks should return empty array for empty text', () => {
    expect(splitIntoChunks('')).toEqual([]);
    expect(splitIntoChunks('   ')).toEqual([]);
  });

  it('splitIntoChunks should handle small text', () => {
    expect(splitIntoChunks('Hello')).toEqual(['Hello']);
  });

  it('should handle reset', () => {
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={[]}>{children}</MockedProvider>,
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.progress.state).toBe('idle');
  });

  it('should handle special characters in safeYamlScalar', async () => {
    const source = { kind: 'manual' as const, provenanceLabel: 'a:b#c' };
    const content = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \"a:b#c\"\n  provenanceConfirmed: \ningestedAt: \"2023-01-01T12:00:00.000Z\"\ncontentSha256: 0000000000000000000000000000000000000000000000000000000000000000\n---\nH`;
    const mocksWithSpecial = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'T' } },
        result: { data: { createDocument: { id: 'd1', title: 'T', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd1', chunkIndex: 0, content: content } },
        result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd1', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={mocksWithSpecial}>{children}</MockedProvider>,
    });
    await act(async () => {
      await result.current.ingestOne({ title: 'T', text: 'H', source });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(result.current.progress.state).toBe('done');
  });

  it('should handle null values in safeYamlScalar and safeYamlBool', async () => {
    const source = { kind: 'manual' as const, provenanceType: undefined, provenanceConfirmed: undefined };
    const content = `---\nsource:\n  kind: manual\n  provenanceType: \n  provenanceLabel: \n  provenanceConfirmed: \ningestedAt: \"2023-01-01T12:00:00.000Z\"\ncontentSha256: 0000000000000000000000000000000000000000000000000000000000000000\n---\nH`;
    const mocksWithNulls = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'T' } },
        result: { data: { createDocument: { id: 'd1', title: 'T', createdAt: FIXED_DATE, __typename: 'Document' } } },
      },
      {
        request: { query: CREATE_CHUNK_MUTATION, variables: { documentId: 'd1', chunkIndex: 0, content: content } },
        result: { data: { createChunk: { id: 'c1', chunkIndex: 0, content: '...', documentId: 'd1', __typename: 'DocumentChunk' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useIngestDocuments('u1'), {
      wrapper: ({ children }) => <MockedProvider mocks={mocksWithNulls}>{children}</MockedProvider>,
    });
    await act(async () => {
      await result.current.ingestOne({ title: 'T', text: 'H', source });
    });
    await waitFor(() => expect(result.current.progress.state).toBe('done'));
    expect(result.current.progress.state).toBe('done');
  });
});
