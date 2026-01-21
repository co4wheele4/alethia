/**
 * Tests for NetworkTraceViewer component
 */

import { render, screen } from '@testing-library/react';
import { NetworkTraceViewer } from '../components/NetworkTraceViewer';

describe('NetworkTraceViewer', () => {
  it('should render title', () => {
    render(<NetworkTraceViewer />);
    expect(screen.getByText('Network Trace (Dev Mode)')).toBeInTheDocument();
  });

  it('should render empty state when no requests', () => {
    render(<NetworkTraceViewer />);
    expect(screen.getByText('No network requests recorded')).toBeInTheDocument();
  });

  it('should render network requests', () => {
    const requests = [
      {
        id: '1',
        url: '/api/users',
        method: 'GET',
        status: 200,
        timestamp: '2024-01-01T10:00:00Z',
        duration: 150,
      },
      {
        id: '2',
        url: '/api/posts',
        method: 'POST',
        status: 201,
        timestamp: '2024-01-01T11:00:00Z',
      },
    ];

    render(<NetworkTraceViewer requests={requests} />);
    
    expect(screen.getByText(/get.*\/api\/users/i)).toBeInTheDocument();
    expect(screen.getByText(/post.*\/api\/posts/i)).toBeInTheDocument();
  });

  it('should display request status', () => {
    const requests = [
      {
        id: '1',
        url: '/api/test',
        method: 'GET',
        status: 404,
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];

    render(<NetworkTraceViewer requests={requests} />);
    
    expect(screen.getByText(/status:.*404/i)).toBeInTheDocument();
  });

  it('should display pending status when no status', () => {
    const requests = [
      {
        id: '1',
        url: '/api/test',
        method: 'GET',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];

    render(<NetworkTraceViewer requests={requests} />);
    
    expect(screen.getByText(/status:.*pending/i)).toBeInTheDocument();
  });

  it('should display duration when provided', () => {
    const requests = [
      {
        id: '1',
        url: '/api/test',
        method: 'GET',
        status: 200,
        timestamp: '2024-01-01T10:00:00Z',
        duration: 250,
      },
    ];

    render(<NetworkTraceViewer requests={requests} />);
    
    expect(screen.getByText(/250ms/i)).toBeInTheDocument();
  });
});
