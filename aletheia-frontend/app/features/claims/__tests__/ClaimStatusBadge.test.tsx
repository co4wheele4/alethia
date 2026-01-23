import { render, screen } from '@testing-library/react';

import { ClaimStatusBadge } from '../components/ClaimStatusBadge';

describe('ClaimStatusBadge', () => {
  it('renders Draft/Reviewed/Accepted/Rejected labels', () => {
    render(
      <div>
        <ClaimStatusBadge status="DRAFT" />
        <ClaimStatusBadge status="REVIEWED" />
        <ClaimStatusBadge status="ACCEPTED" />
        <ClaimStatusBadge status="REJECTED" />
      </div>
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});

