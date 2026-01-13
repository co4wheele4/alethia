/**
 * Edge case tests for OverrideHistoryPanel component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen } from '@testing-library/react';
import { OverrideHistoryPanel } from '../../../components/user-agency/OverrideHistoryPanel';

describe('OverrideHistoryPanel Edge Cases', () => {
  it('should handle override with all optional fields', () => {
    const overrides = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        reason: 'Full override',
        user: 'user1',
        previousValue: 'Old Value',
        newValue: 'New Value',
      },
    ];

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    expect(screen.getByText('Full override')).toBeInTheDocument();
    // previousValue and newValue are not displayed in current implementation
  });

  it('should handle override without optional fields', () => {
    const overrides = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        reason: 'Simple override',
        user: 'user1',
      },
    ];

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    expect(screen.getByText('Simple override')).toBeInTheDocument();
  });

  it('should handle many overrides', () => {
    const overrides = Array.from({ length: 50 }, (_, i) => ({
      id: `id${i}`,
      timestamp: `2024-01-01T${10 + i}:00:00Z`,
      reason: `Reason ${i}`,
      user: `user${i}`,
    }));

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    // Check first and last
    expect(screen.getByText('Reason 0')).toBeInTheDocument();
    expect(screen.getByText('Reason 49')).toBeInTheDocument();
  });

  it('should handle override with empty reason', () => {
    const overrides = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        reason: '',
        user: 'user1',
      },
    ];

    const { container } = render(<OverrideHistoryPanel overrides={overrides} />);
    
    // Empty reason should still be displayed in a list item
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThan(0);
    // Should contain user info
    expect(screen.getByText(/user1/i)).toBeInTheDocument();
  });

  it('should handle override with very long reason', () => {
    const longReason = 'A'.repeat(500);
    const overrides = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        reason: longReason,
        user: 'user1',
      },
    ];

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    expect(screen.getByText(longReason)).toBeInTheDocument();
  });
});
