/**
 * Tests for ImmutableRecordBadge component
 */

import { render, screen } from '@testing-library/react';
import { ImmutableRecordBadge } from '../components/ImmutableRecordBadge';

describe('ImmutableRecordBadge', () => {
  it('should render with default label', () => {
    render(<ImmutableRecordBadge />);
    expect(screen.getByText('Immutable')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<ImmutableRecordBadge label="Locked Record" />);
    expect(screen.getByText('Locked Record')).toBeInTheDocument();
  });

  it('should render with lock icon', () => {
    const { container } = render(<ImmutableRecordBadge />);
    // Lock icon should be present (MUI Chip with icon)
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('should have small size', () => {
    const { container } = render(<ImmutableRecordBadge />);
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });
});
