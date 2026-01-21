/**
 * Tests for HumanOverrideButton component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { HumanOverrideButton } from '../components/HumanOverrideButton';

describe('HumanOverrideButton', () => {
  it('should render with default label', () => {
    render(<HumanOverrideButton />);
    expect(screen.getByRole('button', { name: /override ai result/i })).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<HumanOverrideButton label="Custom Override" />);
    expect(screen.getByRole('button', { name: /custom override/i })).toBeInTheDocument();
  });

  it('should call onOverride when clicked', () => {
    const handleOverride = vi.fn();
    render(<HumanOverrideButton onOverride={handleOverride} />);
    
    const button = screen.getByRole('button', { name: /override ai result/i });
    fireEvent.click(button);
    
    expect(handleOverride).toHaveBeenCalledTimes(1);
  });

  it('should work without onOverride handler', () => {
    render(<HumanOverrideButton />);
    const button = screen.getByRole('button', { name: /override ai result/i });
    
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });
});
