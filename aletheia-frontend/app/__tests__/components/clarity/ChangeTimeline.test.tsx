/**
 * Tests for ChangeTimeline component
 */

import { render, screen } from '@testing-library/react';
import { ChangeTimeline } from '../../../components/clarity/ChangeTimeline';

describe('ChangeTimeline', () => {
  it('should render empty state when no events', () => {
    render(<ChangeTimeline />);
    expect(screen.getByText('No change events recorded')).toBeInTheDocument();
  });

  it('should render events', () => {
    const events = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        description: 'First change',
      },
      {
        id: '2',
        timestamp: '2024-01-01T11:00:00Z',
        description: 'Second change',
        author: 'user1',
      },
    ];

    render(<ChangeTimeline events={events} />);
    
    expect(screen.getByText('First change')).toBeInTheDocument();
    expect(screen.getByText('Second change')).toBeInTheDocument();
    expect(screen.getByText(/user1/i)).toBeInTheDocument();
  });

  it('should render events without author', () => {
    const events = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        description: 'Change without author',
      },
    ];

    render(<ChangeTimeline events={events} />);
    
    expect(screen.getByText('Change without author')).toBeInTheDocument();
  });

  it('should render multiple events', () => {
    const events = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        description: 'Event 1',
      },
      {
        id: '2',
        timestamp: '2024-01-01T11:00:00Z',
        description: 'Event 2',
      },
      {
        id: '3',
        timestamp: '2024-01-01T12:00:00Z',
        description: 'Event 3',
      },
    ];

    render(<ChangeTimeline events={events} />);
    
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Event 3')).toBeInTheDocument();
  });
});
