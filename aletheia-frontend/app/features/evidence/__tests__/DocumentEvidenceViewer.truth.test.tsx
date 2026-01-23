import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { print } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../../../hooks/useTheme';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { DocumentsEvidenceLayout } from '../components/DocumentsEvidenceLayout';
import { DOCUMENTS_BY_USER_QUERY } from '../../documents/graphql';
import { GET_DOCUMENT_EVIDENCE_VIEW_QUERY } from '../graphql';

const docList = [
  {
    __typename: 'Document' as const,
    id: 'doc_1',
    title: 'Example: Public article snapshot',
    createdAt: '2026-01-20T10:15:00.000Z',
    // Note: query selection includes these but the UI list ignores them.
    sourceType: 'URL',
    sourceLabel: 'example.com / public-article',
  },
];

const docEvidence = {
  __typename: 'Document' as const,
  id: 'doc_1',
  title: 'Example: Public article snapshot',
  createdAt: '2026-01-20T10:15:00.000Z',
  sourceType: 'URL',
  sourceLabel: 'example.com / public-article',
  source: {
    __typename: 'DocumentSource' as const,
    id: 'src_1',
    documentId: 'doc_1',
    kind: 'URL',
    ingestedAt: '2026-01-20T10:15:10.000Z',
    accessedAt: '2026-01-20T10:15:05.000Z',
    publishedAt: '2025-12-01T00:00:00.000Z',
    author: 'Example Author',
    publisher: 'Example Publisher',
    filename: null,
    mimeType: 'text/html',
    contentType: null,
    sizeBytes: 12345,
    requestedUrl: 'https://example.com/public-article',
    fetchedUrl: 'https://example.com/public-article?utm_source=aletheia',
    contentSha256: 'content_sha_1',
    fileSha256: null,
    lastModifiedMs: '1733078400000',
  },
  chunks: [
    {
      __typename: 'DocumentChunk' as const,
      id: 'chunk_1_0',
      chunkIndex: 0,
      content:
        'Aletheia is a truth-discovery system. Example Publisher states that Aletheia prioritizes provenance.',
      documentId: 'doc_1',
      mentions: [
        {
          __typename: 'EntityMention' as const,
          id: 'm_1',
          entityId: 'e_1',
          chunkId: 'chunk_1_0',
          startOffset: 0,
          endOffset: 8,
          excerpt: 'Aletheia',
          entity: {
            __typename: 'Entity' as const,
            id: 'e_1',
            name: 'Aletheia',
            type: 'System',
            mentionCount: 2,
          },
        },
      ],
    },
  ],
};

describe('Truth Surface v1: Document Evidence Viewer', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('highlights exact spans from offsets when an entity is selected', async () => {
    const user = userEvent.setup();

    const mocks = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: docList } },
      },
      {
        request: { query: GET_DOCUMENT_EVIDENCE_VIEW_QUERY, variables: { id: 'doc_1' } },
        result: { data: { document: docEvidence } },
      },
    ];

    render(
      <ThemeProvider>
        <MockedProvider mocks={mocks}>
          <DocumentsEvidenceLayout userId="u1" />
        </MockedProvider>
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText('Aletheia')).toBeInTheDocument());
    await user.click(screen.getByText('Aletheia'));

    const mark = await screen.findByTestId('mention-highlight-m_1');
    expect(mark).toHaveTextContent('Aletheia');
    expect(mark).toHaveAttribute('data-start', '0');
    expect(mark).toHaveAttribute('data-end', '8');

    // Evidence panel must show provenance + chunk linkage + offsets.
    expect(await screen.findByTestId('truth-provenance')).toHaveTextContent('sourceType=URL');
    expect(screen.getByText(/Chunk 0 • offsets 0–8/i)).toBeInTheDocument();
    expect(screen.getByText(/chunkId=chunk_1_0/i)).toBeInTheDocument();
  });

  it('fails loudly when provenance is missing', async () => {
    const badDoc = {
      ...docEvidence,
      sourceLabel: null,
    };

    const mocks = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: docList } },
      },
      {
        request: { query: GET_DOCUMENT_EVIDENCE_VIEW_QUERY, variables: { id: 'doc_1' } },
        result: { data: { document: badDoc } },
      },
    ];

    render(
      <ThemeProvider>
        <MockedProvider mocks={mocks}>
          <ErrorBoundary>
            <DocumentsEvidenceLayout userId="u1" />
          </ErrorBoundary>
        </MockedProvider>
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText(/Document\.sourceLabel is missing/i)).toBeInTheDocument());
  });

  it('fails loudly when mention offsets are missing', async () => {
    const badDoc = {
      ...docEvidence,
      chunks: [
        {
          ...docEvidence.chunks[0],
          mentions: [
            {
              ...docEvidence.chunks[0].mentions[0],
              startOffset: null,
              endOffset: null,
            },
          ],
        },
      ],
    };

    const mocks = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: docList } },
      },
      {
        request: { query: GET_DOCUMENT_EVIDENCE_VIEW_QUERY, variables: { id: 'doc_1' } },
        result: { data: { document: badDoc } },
      },
    ];

    render(
      <ThemeProvider>
        <MockedProvider mocks={mocks}>
          <ErrorBoundary>
            <DocumentsEvidenceLayout userId="u1" />
          </ErrorBoundary>
        </MockedProvider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/EntityMention\(m_1\) requires numeric startOffset\/endOffset/i)).toBeInTheDocument()
    );
  });

  it('uses the required fragments and does not mention confidence', () => {
    const s = print(GET_DOCUMENT_EVIDENCE_VIEW_QUERY);

    expect(s).toContain('fragment DocumentCoreFields on Document');
    expect(s).toContain('fragment EntityCoreFields on Entity');
    expect(s).toContain('fragment EntityMentionEvidenceFields on EntityMention');
    expect(s).toContain('fragment DocumentEvidenceView on Document');
    expect(s).toContain('...DocumentEvidenceView');

    expect(s.toLowerCase()).not.toContain('confidence');
    expect(s.toLowerCase()).not.toContain('probability');
  });
});

