import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';

import { ReviewerQueueProvider, ReviewerQueueView, parseReviewerQueueSeedFromSearchParams, useReviewerQueue } from '../index';

function SeededQueue(props: { seed: { claimId: string; claimText: string; requestedFrom?: string } }) {
  const { enqueue, items } = useReviewerQueue();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('requestedFrom', props.seed.requestedFrom ?? 'compare');
    params.set('claimId', props.seed.claimId);
    params.set('claimText', props.seed.claimText);
    enqueue(parseReviewerQueueSeedFromSearchParams(params));
  }, [enqueue, props.seed.claimId, props.seed.claimText, props.seed.requestedFrom]);

  return <ReviewerQueueView items={items} />;
}

describe('Reviewer queue (stub)', () => {
  it('renders the required non-truth messaging', () => {
    render(<ReviewerQueueView items={[]} />);
    expect(
      screen.getByText('Reviewer queues are a coordination aid. They do not change claim status or truth.')
    ).toBeInTheDocument();
  });

  it('renders entries from navigation context (URL-seeded, in-memory queue)', async () => {
    render(
      <ReviewerQueueProvider>
        <SeededQueue seed={{ claimId: 'c1', claimText: 'Example claim text', requestedFrom: 'compare' }} />
      </ReviewerQueueProvider>
    );

    expect(await screen.findByText('Example claim text')).toBeInTheDocument();
    expect(screen.getByText(/Source:\s*Comparison/i)).toBeInTheDocument();
    expect(screen.getByText('Review Requested (Not Yet Assigned)')).toBeInTheDocument();
  });
});

