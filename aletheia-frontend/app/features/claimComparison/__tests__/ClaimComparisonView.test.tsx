import { render, screen } from '@testing-library/react';

import { ClaimComparisonView } from '../components/ClaimComparisonView';

import * as comparisonHook from '../hooks/useClaimsForComparison';

vi.mock('../hooks/useClaimsForComparison');
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(() => ({ data: { entityRelationships: [] }, loading: false, error: undefined })),
}));

describe('ClaimComparisonView', () => {
  it('renders base + related claims as independent columns with offset-grounded evidence and lifecycle badges', () => {
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
              sourceType: 'URL',
              sourceLabel: 'example.com',
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
              sourceType: 'URL',
              sourceLabel: 'example.com',
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

    render(<ClaimComparisonView baseClaimId="c1" />);

    expect(screen.getByText(/Claim comparison/i)).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Claim 2')).toBeInTheDocument();
    // Claim text is diff-rendered (split across spans); assert via textContent includes.
    expect(document.body.textContent ?? '').toContain('Claim one text');
    expect(document.body.textContent ?? '').toContain('two text');

    // Lifecycle badges render.
    expect(screen.getAllByText(/draft/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/reviewed/i)[0]).toBeInTheDocument();

    // Evidence snippet renders with offsets and highlight mark.
    expect(screen.getAllByText(/Source document:/i)[0]).toHaveTextContent('Doc 1');
    expect(screen.getAllByText(/offsets 0–8/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('mention-highlight-m_1')[0]).toHaveTextContent('Aletheia');
  });
});

