import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';

import {
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
  LIST_CLAIMS_QUERY,
  LIST_RELATIONSHIPS_QUERY,
} from '@/src/graphql';
import { useClaimReview } from '../hooks/useClaimReview';

const docCore = {
  __typename: 'Document' as const,
  id: 'doc_1',
  title: 'Doc 1',
  createdAt: '2026-01-01T00:00:00.000Z',
  sourceType: 'URL',
  sourceLabel: 'example',
  source: {
    __typename: 'DocumentSource' as const,
    id: 'src_1',
    documentId: 'doc_1',
    kind: 'URL',
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
  },
};

const claim1 = {
  __typename: 'Claim' as const,
  id: 'c1',
  text: 'Claim text',
  status: 'DRAFT' as const,
  createdAt: '2026-01-02T00:00:00.000Z',
  evidence: [
    {
      __typename: 'ClaimEvidence' as const,
      id: 'cev1',
      claimId: 'c1',
      documentId: 'doc_1',
      createdAt: '2026-01-02T00:00:00.000Z',
      mentionIds: ['m1'],
      relationshipIds: ['r1'],
    },
  ],
  documents: [docCore],
};

const docEvidenceView = {
  ...docCore,
  chunks: [
    {
      __typename: 'DocumentChunk' as const,
      id: 'chunk_1_0',
      chunkIndex: 0,
      content: 'Hello Test Entity.',
      documentId: 'doc_1',
      mentions: [
        {
          __typename: 'EntityMention' as const,
          id: 'm1',
          entityId: 'e1',
          chunkId: 'chunk_1_0',
          startOffset: 6,
          endOffset: 10,
          excerpt: 'Test',
          entity: {
            __typename: 'Entity' as const,
            id: 'e1',
            name: 'Test Entity',
            type: 'Thing',
            mentionCount: 1,
          },
        },
      ],
    },
  ],
};

const relationships = [
  {
    __typename: 'EntityRelationship' as const,
    id: 'r1',
    relation: 'MENTIONS',
    from: { __typename: 'Entity' as const, id: 'e1', name: 'A', type: 'Thing', mentionCount: 1 },
    to: { __typename: 'Entity' as const, id: 'e2', name: 'B', type: 'Thing', mentionCount: 1 },
    evidence: [
      {
        __typename: 'EntityRelationshipEvidence' as const,
        id: 'ev1',
        kind: 'TEXT_SPAN',
        createdAt: '2026-01-02T00:00:00.000Z',
        relationshipId: 'r1',
        chunkId: 'chunk_1_0',
        startOffset: 0,
        endOffset: 5,
        quotedText: 'Hello',
        chunk: {
          __typename: 'DocumentChunk' as const,
          id: 'chunk_1_0',
          chunkIndex: 0,
          content: 'Hello Test Entity.',
          documentId: 'doc_1',
          document: docCore,
        },
        mentionLinks: [],
      },
    ],
  },
];

describe('useClaimReview', () => {
  it('resolves offset-based evidence items for a claim', async () => {
    const mocks = [
      {
        request: { query: LIST_CLAIMS_QUERY },
        result: { data: { claims: [claim1] } },
      },
      {
        request: { query: GET_DOCUMENT_EVIDENCE_VIEW_QUERY, variables: { id: 'doc_1' } },
        result: { data: { document: docEvidenceView } },
      },
      {
        request: { query: LIST_RELATIONSHIPS_QUERY },
        result: { data: { entityRelationships: relationships } },
      },
    ];

    const { result } = renderHook(() => useClaimReview('c1'), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await waitFor(() => expect(result.current.claimsLoading).toBe(false));
    await waitFor(() => expect(result.current.claim?.id).toBe('c1'));
    await waitFor(() => expect(result.current.evidenceLoading).toBe(false));
    await waitFor(() => expect(result.current.contractError).toBeNull());
    await waitFor(() => expect(result.current.evidenceItems.length).toBeGreaterThan(0));

    expect(result.current.claim?.id).toBe('c1');
    expect(result.current.evidenceItems.some((i) => i.kind === 'mention')).toBe(true);
  });
});

