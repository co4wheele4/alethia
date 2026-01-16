import React from 'react';
import { render, screen } from '@testing-library/react';
import { UncertaintyBadge } from '../../../components/clarity/UncertaintyBadge';

describe('UncertaintyBadge', () => {
  it('renders the explicit label override when provided', () => {
    render(<UncertaintyBadge level="unknown" label="Custom label" />);
    expect(screen.getByText('Custom label')).toBeInTheDocument();
  });

  it('renders the default label for each level', () => {
    const { rerender } = render(<UncertaintyBadge level="known" />);
    expect(screen.getByText('Known')).toBeInTheDocument();

    rerender(<UncertaintyBadge level="partial" />);
    expect(screen.getByText('Partially supported')).toBeInTheDocument();

    rerender(<UncertaintyBadge level="uncertain" />);
    expect(screen.getByText('Uncertain')).toBeInTheDocument();

    rerender(<UncertaintyBadge level="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

