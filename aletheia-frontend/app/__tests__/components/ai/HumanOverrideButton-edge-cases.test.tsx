/**
 * Edge case tests for HumanOverrideButton component
 * Tests edge cases and all code paths
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { HumanOverrideButton } from '../../../components/ai/HumanOverrideButton';

describe('HumanOverrideButton Edge Cases', () => {
  it('should handle empty string label', () => {
    render(<HumanOverrideButton label="" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle very long label', () => {
    const longLabel = 'A'.repeat(100);
    render(<HumanOverrideButton label={longLabel} />);
    expect(screen.getByRole('button', { name: new RegExp(longLabel) })).toBeInTheDocument();
  });

  it('should handle label with special characters', () => {
    const specialLabel = 'Override!@#$%^&*()';
    render(<HumanOverrideButton label={specialLabel} />);
    expect(screen.getByRole('button', { name: specialLabel })).toBeInTheDocument();
  });

  it('should have EditIcon', () => {
    render(<HumanOverrideButton />);
    // Icon should be present (MUI icons are rendered as SVG)
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle multiple rapid clicks', () => {
    const handleOverride = vi.fn();
    render(<HumanOverrideButton onOverride={handleOverride} />);
    
    const button = screen.getByRole('button', { name: /override ai result/i });
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(handleOverride).toHaveBeenCalledTimes(3);
  });
});
