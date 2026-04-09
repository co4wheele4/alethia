import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';

import { ClaimComparisonView } from '../components/ClaimComparisonView';
import { REQUEST_REVIEW_MUTATION } from '@/src/graphql';

import * as comparisonHook from '../hooks/useClaimsForComparison';

vi.mock('../hooks/useClaimsForComparison');
vi.mock('@apollo/client/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client/react')>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: { entityRelationships: [] }, loading: false, error: undefined })),
  };
});
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

/** ADR-019 Evidence shape (matches buildEvidenceModel in ClaimComparisonView). */
const comparisonEvidence = (id: string) =>
  ({
    __typename: 'Evidence' as const,
    id,
    createdAt: '2026-01-21T12:00:00.000Z',
    createdBy: 'u1',
    sourceType: 'DOCUMENT' as const,
    sourceDocumentId: 'doc_1',
    chunkId: 'chunk_1_0',
    startOffset: 0,
    endOffset: 8,
    snippet: 'Aletheia',
  }) satisfies comparisonHook.ClaimComparisonClaim['evidence'][number];

describe('ClaimComparisonView', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders base + related claims as independent columns with offset-grounded evidence and lifecycle badges', () => {
    vi.mocked(comparisonHook.useClaimsForComparison).mockReturnValue({
      claims: [
        {
          __typename: 'Claim',
          id: 'c1',
          text: 'Claim one text',
          status: 'DRAFT',
          createdAt: '2026-01-21T12:00:00.000Z',
          evidence: [comparisonEvidence('ev1')],
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
          evidence: [comparisonEvidence('ev2')],
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

    render(
      <MockedProvider mocks={[]}>
        <ClaimComparisonView baseClaimId="c1" />
      </MockedProvider>,
    );

    expect(screen.getByText(/Claim comparison/i)).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Claim 2')).toBeInTheDocument();
    // Claim text is diff-rendered (split across spans); assert via textContent includes.
    expect(document.body.textContent ?? '').toContain('Claim one text');
    expect(document.body.textContent ?? '').toContain('two text');

    // Lifecycle badges render.
    expect(screen.getAllByText(/draft/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/reviewed/i)[0]).toBeInTheDocument();

    // Evidence snippet renders with offsets and highlight mark (ADR-019 Evidence + chunk offsets).
    expect(screen.getAllByText(/Source document:/i)[0]).toHaveTextContent('Doc 1');
    expect(screen.getAllByText(/offsets 0–8/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('mention-highlight-m_1')[0]).toHaveTextContent('Aletheia');
  });

  it('requests review via mutation and navigates to the persisted review queue', async () => {
    vi.mocked(comparisonHook.useClaimsForComparison).mockReturnValue({
      claims: [
        {
          __typename: 'Claim',
          id: 'c1',
          text: 'Claim one text',
          status: 'DRAFT',
          createdAt: '2026-01-21T12:00:00.000Z',
          evidence: [comparisonEvidence('ev1')],
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

    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: REQUEST_REVIEW_MUTATION,
          variables: { claimId: 'c1', source: 'COMPARISON', note: null },
        },
        result: {
          data: {
            requestReview: {
              __typename: 'ReviewRequest',
              id: 'rr1',
              claimId: 'c1',
              requestedAt: '2026-01-21T12:00:00.000Z',
              source: 'COMPARISON',
              note: null,
              requestedBy: { __typename: 'User', id: 'u1', email: 'u1@example.com', name: null },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ClaimComparisonView baseClaimId="c1" />
      </MockedProvider>
    );

    const open = screen.getByRole('button', { name: /request review/i });
    await user.click(open);

    // Modal explains non-mutating intent (ADR-009/010/011).
    expect(screen.getByLabelText('Request review dialog')).toBeInTheDocument();
    expect(screen.getByText(/Requesting review does not resolve or modify claims/i)).toBeInTheDocument();
    expect(screen.getByText(/do not change truth or claim status/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^request review$/i }));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/review-queue');
  });
});

