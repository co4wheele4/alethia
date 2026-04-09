import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';

import * as ApolloReact from '@apollo/client/react';
import { GET_DOCUMENT_EVIDENCE_VIEW_QUERY } from '@/src/graphql';
import { useDocumentEvidence } from '../useDocumentEvidence';

vi.mock('@apollo/client/react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@apollo/client/react')>();
  return { ...mod, useQuery: vi.fn() };
});

const useQueryMock = ApolloReact.useQuery as unknown as Mock;

const source = {
  __typename: 'DocumentSource' as const,
  id: 'src_1',
  documentId: 'd1',
  kind: 'FILE',
  ingestedAt: null,
  accessedAt: null,
  publishedAt: null,
  author: null,
  publisher: null,
  filename: null,
  mimeType: null,
  contentType: null,
  sizeBytes: null,
  requestedUrl: null,
  fetchedUrl: null,
  contentSha256: null,
  fileSha256: null,
  lastModifiedMs: null,
};

const baseDoc = {
  __typename: 'Document' as const,
  id: 'd1',
  title: 'Doc',
  createdAt: '2026-01-01T00:00:00.000Z',
  sourceType: 'FILE',
  sourceLabel: 'label',
  source,
};

const validChunk = {
  __typename: 'DocumentChunk' as const,
  id: 'c1',
  chunkIndex: 0,
  content: 'hello world',
  documentId: 'd1',
  mentions: [
    {
      __typename: 'EntityMention' as const,
      id: 'm1',
      entityId: 'e1',
      chunkId: 'c1',
      startOffset: 0,
      endOffset: 5,
      excerpt: 'hello',
      entity: {
        __typename: 'Entity' as const,
        id: 'e1',
        name: 'Beta',
        type: 'T',
        mentionCount: 1,
      },
    },
  ],
};

type UseQueryResult = ReturnType<typeof ApolloReact.useQuery>;

function mockQuery(overrides: Partial<UseQueryResult>) {
  useQueryMock.mockReturnValue({
    loading: false,
    error: undefined,
    data: undefined,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as UseQueryResult);
}

describe('useDocumentEvidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((query: unknown, options?: { skip?: boolean }) => {
      if (options?.skip) {
        return {
          loading: false,
          error: undefined,
          data: undefined,
          refetch: vi.fn(),
        } as unknown as UseQueryResult;
      }
      return {
        loading: false,
        error: undefined,
        data: { document: { ...baseDoc, chunks: [validChunk] } },
        refetch: vi.fn(),
      } as unknown as UseQueryResult;
    });
  });

  it('returns empty state when documentId is null (skipped query)', () => {
    const { result } = renderHook(() => useDocumentEvidence(null));
    expect(result.current.document).toBeNull();
    expect(result.current.entities).toEqual([]);
    expect(useQueryMock).toHaveBeenCalledWith(
      GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
      expect.objectContaining({ skip: true }),
    );
  });

  it('returns empty document/entities while loading', () => {
    mockQuery({ loading: true, data: undefined });
    const { result } = renderHook(() => useDocumentEvidence('d1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.document).toBeNull();
    expect(result.current.entities).toEqual([]);
  });

  it('does not assert contract while query has error', () => {
    mockQuery({ loading: false, error: new Error('network'), data: undefined });
    const { result } = renderHook(() => useDocumentEvidence('d1'));
    expect(result.current.error?.message).toBe('network');
    expect(result.current.document).toBeNull();
  });

  it('resolves document and sorted entities for valid Truth Surface data', () => {
    const chunkB = {
      ...validChunk,
      id: 'c2',
      chunkIndex: 1,
      content: 'x',
      mentions: [
        {
          ...validChunk.mentions[0],
          id: 'm2',
          chunkId: 'c2',
          startOffset: 0,
          endOffset: 1,
          entity: validChunk.mentions[0].entity,
        },
      ],
    };
    const chunkA = {
      ...validChunk,
      mentions: [
        {
          ...validChunk.mentions[0],
          entity: { ...validChunk.mentions[0].entity, name: 'Alpha' },
        },
      ],
    };
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [chunkA, chunkB],
        },
      },
    });
    const { result } = renderHook(() => useDocumentEvidence('d1'));
    expect(result.current.document?.id).toBe('d1');
    expect(result.current.entities.map((r) => r.entity.name)).toEqual(['Alpha']);
    expect(result.current.entities[0].mentions.map((m) => m.chunkIndex)).toEqual([0, 1]);
  });

  it('throws when document is missing after successful load', () => {
    mockQuery({ data: { document: null } });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/Document\(d1\) is missing/);
  });

  it('throws when provenance fields are missing', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          sourceType: null,
          chunks: [validChunk],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/Document\.sourceType/);
  });

  it('throws when document has no chunks', () => {
    mockQuery({ data: { document: { ...baseDoc, chunks: [] } } });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/no chunks/);
  });

  it('throws when there are no mentions', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [{ ...validChunk, mentions: [] }],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/no mentions/);
  });

  it('throws when chunk content is missing', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [{ ...validChunk, content: null as unknown as string }],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/content/);
  });

  it('throws when mention entity is missing', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], entity: null as unknown as (typeof validChunk.mentions)[0]['entity'] }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/entity/);
  });

  it('throws when entityId does not match entity.id', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], entityId: 'wrong' }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/entityId does not match/);
  });

  it('throws when mention chunkId does not match chunk id', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], chunkId: 'other' }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/chunkId does not match/);
  });

  it('throws when offsets are not numeric', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], startOffset: null as unknown as number, endOffset: 1 }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/numeric startOffset/);
  });

  it('throws when offsets are invalid (end <= start)', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], startOffset: 3, endOffset: 3 }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/invalid offsets/);
  });

  it('throws when start offset is negative', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], startOffset: -1, endOffset: 2 }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/invalid offsets/);
  });

  it('throws when offsets are out of bounds for chunk content', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [{ ...validChunk.mentions[0], startOffset: 0, endOffset: 999 }],
            },
          ],
        },
      },
    });
    expect(() => renderHook(() => useDocumentEvidence('d1'))).toThrow(/out of bounds/);
  });

  it('sorts entity rows by entity name (localeCompare)', () => {
    const mentionZ = {
      ...validChunk.mentions[0],
      id: 'mz',
      entityId: 'eZ',
      entity: { ...validChunk.mentions[0].entity, id: 'eZ', name: 'Zebra' },
    };
    const mentionA = {
      ...validChunk.mentions[0],
      id: 'ma',
      entityId: 'eA',
      entity: { ...validChunk.mentions[0].entity, id: 'eA', name: 'Alpha' },
    };
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [mentionZ, mentionA],
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useDocumentEvidence('d1'));
    expect(result.current.entities.map((r) => r.entity.name)).toEqual(['Alpha', 'Zebra']);
  });

  it('merges multiple mentions for the same entity (existing row branch)', () => {
    mockQuery({
      data: {
        document: {
          ...baseDoc,
          chunks: [
            {
              ...validChunk,
              mentions: [
                validChunk.mentions[0],
                {
                  ...validChunk.mentions[0],
                  id: 'm2',
                  startOffset: 6,
                  endOffset: 11,
                  excerpt: 'world',
                },
              ],
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useDocumentEvidence('d1'));
    expect(result.current.entities[0].mentions.length).toBe(2);
  });
});
