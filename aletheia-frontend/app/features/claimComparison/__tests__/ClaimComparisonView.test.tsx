import { render, screen, within } from '@testing-library/react';

import { ClaimComparisonView } from '../components/ClaimComparisonView';

import * as comparisonHook from '../hooks/useClaimsForComparison';

vi.mock('../hooks/useClaimsForComparison');

describe('ClaimComparisonView', () => {
  it('renders two claims side-by-side with document-grouped evidence and offset highlights', () => {
    vi.mocked(comparisonHook.useClaimsForComparison).mockReturnValue({
      claims: [
        {
          __typename: 'Claim',
          id: 'c1',
          text: 'Claim one text',
          status: 'DRAFT',
          createdAt: '2026-01-21T12:00:00.000Z',
          evidence: [
            {
              __typename: 'ClaimEvidence',
              id: 'ev1',
              claimId: 'c1',
              documentId: 'doc_1',
              createdAt: '2026-01-21T12:00:00.000Z',
              mentionIds: ['m_1'],
              relationshipIds: [],
            },
          ],
          documents: [
            {
              __typename: 'Document',
              id: 'doc_1',
              title: 'Doc 1',
              createdAt: '2026-01-20T10:15:00.000Z',
              chunks: [
                {
                  __typename: 'DocumentChunk',
                  id: 'chunk_1_0',
                  chunkIndex: 0,
                  content: 'Aletheia is a truth-discovery system.',
                  documentId: 'doc_1',
                  mentions: [
                    {
                      __typename: 'EntityMention',
                      id: 'm_1',
                      entityId: 'e_1',
                      chunkId: 'chunk_1_0',
                      startOffset: 0,
                      endOffset: 8,
                      excerpt: 'Aletheia',
                      entity: { __typename: 'Entity', id: 'e_1', name: 'Aletheia', type: 'System', mentionCount: 1 },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          __typename: 'Claim',
          id: 'c2',
          text: 'Claim two text',
          status: 'REVIEWED',
          createdAt: '2026-01-21T12:00:00.000Z',
          evidence: [
            {
              __typename: 'ClaimEvidence',
              id: 'ev2',
              claimId: 'c2',
              documentId: 'doc_1',
              createdAt: '2026-01-21T12:00:00.000Z',
              mentionIds: ['m_1'],
              relationshipIds: [],
            },
          ],
          documents: [
            {
              __typename: 'Document',
              id: 'doc_1',
              title: 'Doc 1',
              createdAt: '2026-01-20T10:15:00.000Z',
              chunks: [
                {
                  __typename: 'DocumentChunk',
                  id: 'chunk_1_0',
                  chunkIndex: 0,
                  content: 'Aletheia is a truth-discovery system.',
                  documentId: 'doc_1',
                  mentions: [
                    {
                      __typename: 'EntityMention',
                      id: 'm_1',
                      entityId: 'e_1',
                      chunkId: 'chunk_1_0',
                      startOffset: 0,
                      endOffset: 8,
                      excerpt: 'Aletheia',
                      entity: { __typename: 'Entity', id: 'e_1', name: 'Aletheia', type: 'System', mentionCount: 1 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ] as any,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ClaimComparisonView leftClaimId="c1" rightClaimId="c2" />);

    expect(screen.getByText(/Claim comparison/i)).toBeInTheDocument();
    expect(screen.getByText('Claim A')).toBeInTheDocument();
    expect(screen.getByText('Claim B')).toBeInTheDocument();
    expect(screen.getByText('Claim one text')).toBeInTheDocument();
    expect(screen.getByText('Claim two text')).toBeInTheDocument();

    // Evidence is grouped by document and includes a source label + highlight span.
    expect(screen.getAllByText(/Source document:/i)[0]).toHaveTextContent('Doc 1');
    const docGroup = screen.getByRole('list', { name: 'claim-evidence-document-c1-doc_1' });
    const mentionRow = within(docGroup).getByText(/Mention • chunk 0/i);
    expect(mentionRow).toBeInTheDocument();

    // Highlight must be offset-driven (mark rendered by MentionHighlightOverlay).
    expect(screen.getAllByTestId('mention-highlight-m_1')[0]).toHaveTextContent('Aletheia');
  });
});

