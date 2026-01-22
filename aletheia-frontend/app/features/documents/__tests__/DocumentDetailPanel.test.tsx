import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';

import { ThemeProvider } from '../../../hooks/useTheme';
import { DocumentDetailPanel } from '../components/DocumentDetailPanel';
import { GET_DOCUMENT_INTELLIGENCE_QUERY } from '@/src/graphql';

const TestWrapper = ({ children, mocks }: { children: React.ReactNode; mocks: any[] }) => (
  <ThemeProvider>
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  </ThemeProvider>
);

describe('DocumentDetailPanel', () => {
  it('renders provenance, offset-based mentions, and relationship evidence', async () => {
    const user = userEvent.setup();

    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_INTELLIGENCE_QUERY,
          variables: { id: 'doc-1' },
        },
        result: {
          data: {
            document: {
              __typename: 'Document',
              id: 'doc-1',
              title: 'Getting Started',
              createdAt: '2026-01-01T00:00:00Z',
              sourceType: 'URL',
              sourceLabel: 'example.com',
              source: {
                __typename: 'DocumentSource',
                id: 'source-doc-1',
                documentId: 'doc-1',
                kind: 'URL',
                ingestedAt: '2026-01-01T00:00:00Z',
                accessedAt: '2026-01-01T00:00:00Z',
                publishedAt: null,
                author: null,
                publisher: null,
                filename: null,
                mimeType: null,
                contentType: null,
                sizeBytes: null,
                requestedUrl: 'https://example.com/getting-started',
                fetchedUrl: 'https://example.com/getting-started',
                contentSha256: null,
                fileSha256: null,
                lastModifiedMs: null,
              },
              chunks: [
                {
                  __typename: 'DocumentChunk',
                  id: 'chunk-doc-1-1',
                  chunkIndex: 1,
                  content: 'This chunk mentions Test Entity.',
                  documentId: 'doc-1',
                  mentions: [
                    {
                      __typename: 'EntityMention',
                      id: 'mention-1',
                      entityId: 'entity-1',
                      chunkId: 'chunk-doc-1-1',
                      startOffset: 17,
                      endOffset: 28,
                      excerpt: 'Test Entity',
                      entity: {
                        __typename: 'Entity',
                        id: 'entity-1',
                        name: 'Test Entity',
                        type: 'TestType',
                        mentionCount: 1,
                      },
                    },
                  ],
                },
              ],
            },
            entityRelationships: [
              {
                __typename: 'EntityRelationship',
                id: 'rel-1',
                relation: 'MENTIONS',
                from: { __typename: 'Entity', id: 'entity-1', name: 'Test Entity', type: 'TestType', mentionCount: 1 },
                to: { __typename: 'Entity', id: 'entity-2', name: 'Other Entity', type: 'TestType', mentionCount: 0 },
                evidence: [
                  {
                    __typename: 'EntityRelationshipEvidence',
                    id: 'ev-1',
                    kind: 'TEXT_SPAN',
                    createdAt: '2026-01-01T00:00:00Z',
                    chunkId: 'chunk-doc-1-1',
                    startOffset: 17,
                    endOffset: 28,
                    quotedText: 'Test Entity',
                    chunk: {
                      __typename: 'DocumentChunk',
                      id: 'chunk-doc-1-1',
                      chunkIndex: 1,
                      content: 'This chunk mentions Test Entity.',
                      documentId: 'doc-1',
                      document: {
                        __typename: 'Document',
                        id: 'doc-1',
                        title: 'Getting Started',
                        createdAt: '2026-01-01T00:00:00Z',
                        sourceType: 'URL',
                        sourceLabel: 'example.com',
                        source: null,
                      },
                    },
                    mentionLinks: [
                      {
                        __typename: 'EntityRelationshipEvidenceMention',
                        evidenceId: 'ev-1',
                        mentionId: 'mention-1',
                        mention: {
                          __typename: 'EntityMention',
                          id: 'mention-1',
                          entityId: 'entity-1',
                          chunkId: 'chunk-doc-1-1',
                          startOffset: 17,
                          endOffset: 28,
                          excerpt: 'Test Entity',
                          entity: {
                            __typename: 'Entity',
                            id: 'entity-1',
                            name: 'Test Entity',
                            type: 'TestType',
                            mentionCount: 1,
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <DocumentDetailPanel documentId="doc-1" />
      </TestWrapper>
    );

    expect(await screen.findByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText(/Source type:\s*URL/i)).toBeInTheDocument();

    const entitiesList = screen.getByRole('list', { name: 'document-entities' });
    await user.click(within(entitiesList).getByText('Test Entity'));
    expect(screen.getByText(/Mention ID:\s*mention-1/i)).toBeInTheDocument();

    // Offset-based highlight exists in chunk text
    expect(screen.getByTestId('chunk-text-1')).toHaveTextContent('Test Entity');

    const relationshipsList = screen.getByRole('list', { name: 'document-relationships' });
    await user.click(within(relationshipsList).getByText(/Test Entity —MENTIONS→ Other Entity/i));
    expect(screen.getByText(/Evidence ID:\s*ev-1/i)).toBeInTheDocument();
    expect(screen.getByText(/mention:mention-1/i)).toBeInTheDocument();
  });
});

