/**
 * Edge case tests for AIResultCard component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen } from '@testing-library/react';
import { AIResultCard } from '../components/AIResultCard';

describe('AIResultCard Edge Cases', () => {
  it('should handle empty string result', () => {
    const { container } = render(<AIResultCard result="" />);
    // Empty string is falsy, so result should not render
    // Component should still render, just without the result text
    expect(container).toBeInTheDocument();
  });

  it('should handle empty string explanation', () => {
    render(<AIResultCard explanation="" />);
    // Empty string is falsy, should show warning
    expect(screen.getByText(/explanation required/i)).toBeInTheDocument();
  });

  it('should handle very long result', () => {
    const longResult = 'A'.repeat(1000);
    render(<AIResultCard result={longResult} />);
    expect(screen.getByText(longResult)).toBeInTheDocument();
  });

  it('should handle very long explanation', () => {
    const longExplanation = 'A'.repeat(1000);
    render(<AIResultCard explanation={longExplanation} />);
    expect(screen.getByText(longExplanation)).toBeInTheDocument();
  });

  it('should show warning when result exists but no explanation', () => {
    render(<AIResultCard result="Some result" />);
    expect(screen.getByText(/explanation required/i)).toBeInTheDocument();
  });

  it('should not show warning when explanation exists', () => {
    render(<AIResultCard result="Result" explanation="Explanation" />);
    expect(screen.queryByText(/explanation required/i)).not.toBeInTheDocument();
  });

  it('should handle result with special characters', () => {
    const specialResult = 'Result!@#$%^&*()_+-=[]{}|;:,.<>?';
    render(<AIResultCard result={specialResult} />);
    expect(screen.getByText(specialResult)).toBeInTheDocument();
  });
});
