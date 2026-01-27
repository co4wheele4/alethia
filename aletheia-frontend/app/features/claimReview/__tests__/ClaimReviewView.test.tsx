import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';

import {
  GET_DOCUMENT_EVIDENCE_VIEW_QUERY,
  LIST_CLAIMS_QUERY,
  LIST_RELATIONSHIPS_QUERY,
} from '@/src/graphql';
import { ClaimReviewView } from '../components/ClaimReviewView';

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
      relationshipIds: [],
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

describe('ClaimReviewView', () => {
  it('renders claim + evidence and blocks adjudication when schema lacks mutations', async () => {
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
        result: { data: { entityRelationships: [] } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ClaimReviewView claimId="c1" />
      </MockedProvider>
    );

    await waitFor(() => expect(screen.getAllByTestId('evidence-item').length).toBe(1), { timeout: 5000 });
    expect(screen.getByText('Claim')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Claim text' })).toBeInTheDocument();

    const accept = screen.getByRole('button', { name: 'Accept claim' });
    expect(accept).toBeDisabled();

    // Explicit contract message (no silent fallback)
    expect(screen.getByText(/does not expose claim review\/adjudication mutations/i)).toBeInTheDocument();
  });
});

