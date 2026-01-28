import { render, screen } from '@testing-library/react';

import { ReviewerQueueView } from '../index';

describe('Review queue (persisted review requests)', () => {
  it('renders the required non-truth messaging', () => {
    render(<ReviewerQueueView items={[]} />);
    expect(screen.getByText(/Review requests coordinate attention/i)).toBeInTheDocument();
  });

  it('groups items by source and renders claim links', async () => {
    render(
      <ReviewerQueueView
        items={[
          {
            __typename: 'ReviewRequest',
            id: 'rr1',
            claimId: 'c1',
            requestedAt: '2026-01-01T00:00:00.000Z',
            source: 'COMPARISON',
            note: null,
            requestedBy: { __typename: 'User', id: 'u1', email: 'u1@example.com', name: 'User One' },
          },
          {
            __typename: 'ReviewRequest',
            id: 'rr2',
            claimId: 'c2',
            requestedAt: '2026-01-01T00:00:00.000Z',
            source: 'CLAIM_VIEW',
            note: 'please check offsets',
            requestedBy: { __typename: 'User', id: 'u1', email: 'u1@example.com', name: null },
          },
        ]}
      />
    );

    expect(await screen.findByText('Comparison')).toBeInTheDocument();
    expect(screen.getByText('Claim view')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /view claim/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Note:\s*please check offsets/i)).toBeInTheDocument();
  });
});

