import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClaimDetailDrawer } from '../components/ClaimDetailDrawer';

describe('ClaimDetailDrawer', () => {
  it('renders empty state when no claim is selected', () => {
    render(<ClaimDetailDrawer open={true} claim={null} onClose={() => {}} />);
    expect(screen.getByText(/Select a claim/i)).toBeInTheDocument();
  });

  it('jumps to documents deep-link when mentionIds exist, else falls back to document route', async () => {
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
          documentId: 'doc_1',
          mentionIds: ['m1'],
          relationshipIds: ['r1'],
          __typename: 'ClaimEvidence',
        },
        {
          id: 'ev2',
          documentId: 'doc_1',
          mentionIds: [],
          relationshipIds: ['r2'],
          __typename: 'ClaimEvidence',
        },
      ],
      __typename: 'Claim',
    };

    render(<ClaimDetailDrawer open={true} claim={claim} onClose={() => {}} />);

    const links = screen.getAllByRole('link', { name: /jump to evidence/i });
    expect(links[0]).toHaveAttribute('href', '/documents?documentId=doc_1&mentionId=m1');
    expect(links[1]).toHaveAttribute('href', '/documents/doc_1');

    // Exercise interaction (no navigation in unit tests, but event handler runs).
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
            evidence: [{ id: 'ev1', documentId: 'doc_1', mentionIds: ['m1'], relationshipIds: [], __typename: 'ClaimEvidence' }],
            __typename: 'Claim',
          } as any
        }
      />
    );

    expect(screen.getByText(/Contract violation: claim has no linked documents/i)).toBeInTheDocument();
  });
});

