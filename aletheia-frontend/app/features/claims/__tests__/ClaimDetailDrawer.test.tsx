import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClaimDetailDrawer } from '../components/ClaimDetailDrawer';

describe('ClaimDetailDrawer', () => {
  it('renders empty state when no claim is selected', () => {
    render(<ClaimDetailDrawer open={true} claim={null} onClose={() => {}} />);
    expect(screen.getByText(/Select a claim/i)).toBeInTheDocument();
  });

  it('jumps to documents with chunk deep-link when chunkId exists, else document route', async () => {
    const user = userEvent.setup();

    const claim: any = {
      id: 'c1',
      status: 'DRAFT',
      text: 'Claim text',
      documents: [
        { id: 'doc_1', title: 'Doc 1', sourceLabel: 'src', __typename: 'Document' },
      ],
      evidence: [
        {
          id: 'ev1',
          sourceDocumentId: 'doc_1',
          chunkId: 'chunk_1',
          startOffset: 0,
          endOffset: 5,
          snippet: 'Claim',
          createdAt: '2026-01-02T00:00:00.000Z',
          createdBy: 'u1',
          sourceType: 'DOCUMENT',
          __typename: 'Evidence',
        },
        {
          id: 'ev2',
          sourceDocumentId: 'doc_1',
          chunkId: null,
          startOffset: null,
          endOffset: null,
          snippet: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          createdBy: 'u1',
          sourceType: 'DOCUMENT',
          __typename: 'Evidence',
        },
      ],
      __typename: 'Claim',
    };

    render(<ClaimDetailDrawer open={true} claim={claim} onClose={() => {}} />);

    const links = screen.getAllByRole('link', { name: /jump to evidence/i });
    expect(links[0]).toHaveAttribute('href', '/documents/doc_1?chunkId=chunk_1');
    expect(links[1]).toHaveAttribute('href', '/documents/doc_1');

    await user.click(links[0]);
  });

  it('shows an error when documents are missing (contract violation)', () => {
    render(
      <ClaimDetailDrawer
        open={true}
        onClose={() => {}}
        claim={
          {
            id: 'c1',
            status: 'DRAFT',
            text: 'Claim text',
            documents: [],
            evidence: [
              {
                id: 'ev1',
                sourceDocumentId: 'doc_1',
                chunkId: 'chunk_1',
                startOffset: 0,
                endOffset: 5,
                snippet: 'Claim',
                createdAt: '2026-01-02T00:00:00.000Z',
                createdBy: 'u1',
                sourceType: 'DOCUMENT',
                __typename: 'Evidence',
              },
            ],
            __typename: 'Claim',
          } as any
        }
      />
    );

    expect(screen.getByText(/Contract violation: claim has no linked documents/i)).toBeInTheDocument();
  });
});

