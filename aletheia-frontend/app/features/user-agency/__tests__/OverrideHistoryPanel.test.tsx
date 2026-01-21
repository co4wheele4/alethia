/**
 * Tests for OverrideHistoryPanel component
 */

import { render, screen } from '@testing-library/react';
import { OverrideHistoryPanel } from '../components/OverrideHistoryPanel';

describe('OverrideHistoryPanel', () => {
  it('should render title', () => {
    render(<OverrideHistoryPanel />);
    expect(screen.getByText('Override History')).toBeInTheDocument();
  });

  it('should render empty state when no overrides', () => {
    render(<OverrideHistoryPanel />);
    expect(screen.getByText('No overrides recorded')).toBeInTheDocument();
  });

  it('should render override records', () => {
    const overrides = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        reason: 'Reason 1',
        user: 'user1',
      },
      {
        id: '2',
        timestamp: '2024-01-01T11:00:00Z',
        reason: 'Reason 2',
        user: 'user2',
        previousValue: 'Old',
        newValue: 'New',
      },
    ];

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    expect(screen.getByText('Reason 1')).toBeInTheDocument();
    expect(screen.getByText('Reason 2')).toBeInTheDocument();
    // Check that user and timestamp are in the text
    const container = screen.getByText('Reason 1').closest('div');
    expect(container?.textContent).toContain('user1');
  });

  it('should render multiple overrides', () => {
    const overrides = [
      { id: '1', timestamp: '2024-01-01T10:00:00Z', reason: 'R1', user: 'u1' },
      { id: '2', timestamp: '2024-01-01T11:00:00Z', reason: 'R2', user: 'u2' },
      { id: '3', timestamp: '2024-01-01T12:00:00Z', reason: 'R3', user: 'u3' },
    ];

    render(<OverrideHistoryPanel overrides={overrides} />);
    
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
    expect(screen.getByText('R3')).toBeInTheDocument();
  });
});
