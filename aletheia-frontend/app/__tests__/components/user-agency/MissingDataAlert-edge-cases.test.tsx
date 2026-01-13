/**
 * Edge case tests for MissingDataAlert component
 * Tests edge cases and all code paths
 */

import { render, screen } from '@testing-library/react';
import { MissingDataAlert } from '../../../components/user-agency/MissingDataAlert';

describe('MissingDataAlert Edge Cases', () => {
  it('should handle empty string message', () => {
    render(<MissingDataAlert message="" />);
    // Empty string is falsy, should use default
    expect(screen.getByText('Required data is missing')).toBeInTheDocument();
  });

  it('should handle empty string field', () => {
    render(<MissingDataAlert field="" />);
    // Empty string is falsy, should use default
    expect(screen.getByText('Required data is missing')).toBeInTheDocument();
  });

  it('should handle very long message', () => {
    const longMessage = 'A'.repeat(500);
    render(<MissingDataAlert message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle very long field name', () => {
    const longField = 'A'.repeat(100);
    render(<MissingDataAlert field={longField} />);
    expect(screen.getByText(new RegExp(`data missing for field: ${longField}`, 'i'))).toBeInTheDocument();
  });

  it('should handle field with special characters', () => {
    render(<MissingDataAlert field="field!@#$%^&*()" />);
    expect(screen.getByText(/data missing for field: field!@#\$%\^\&\*\(\)/i)).toBeInTheDocument();
  });

  it('should prioritize message over field when both provided', () => {
    render(<MissingDataAlert message="Custom message" field="email" />);
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
  });
});
