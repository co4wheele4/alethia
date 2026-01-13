/**
 * Tests for AuditView component
 */

import { render, screen } from '@testing-library/react';
import { AuditView } from '../../../components/integrity/AuditView';

describe('AuditView', () => {
  it('should render title', () => {
    render(<AuditView />);
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
  });

  it('should render empty state when no audit trail', () => {
    render(<AuditView />);
    expect(screen.getByText('No audit records available')).toBeInTheDocument();
  });

  it('should render audit records', () => {
    const auditTrail = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        action: 'Created',
        user: 'user1',
      },
      {
        id: '2',
        timestamp: '2024-01-01T11:00:00Z',
        action: 'Updated',
        user: 'user2',
        details: 'Changed status',
      },
    ];

    render(<AuditView auditTrail={auditTrail} />);
    
    // Check for action text (in <strong> tag)
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    // Check for details
    expect(screen.getByText('Changed status')).toBeInTheDocument();
    // Check that records are rendered (by checking for timestamp or user in the text content)
    const container = screen.getByText('Created').closest('div');
    expect(container?.textContent).toContain('user1');
  });

  it('should render records without details', () => {
    const auditTrail = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        action: 'Deleted',
        user: 'admin',
      },
    ];

    render(<AuditView auditTrail={auditTrail} />);
    
    // Check for action text
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    // Check that user is in the text content
    const container = screen.getByText('Deleted').closest('div');
    expect(container?.textContent).toContain('admin');
    expect(screen.queryByText('Changed status')).not.toBeInTheDocument();
  });

  it('should render multiple records', () => {
    const auditTrail = [
      {
        id: '1',
        timestamp: '2024-01-01T10:00:00Z',
        action: 'Action 1',
        user: 'user1',
      },
      {
        id: '2',
        timestamp: '2024-01-01T11:00:00Z',
        action: 'Action 2',
        user: 'user2',
      },
      {
        id: '3',
        timestamp: '2024-01-01T12:00:00Z',
        action: 'Action 3',
        user: 'user3',
      },
    ];

    render(<AuditView auditTrail={auditTrail} />);
    
    expect(screen.getByText(/action 1/i)).toBeInTheDocument();
    expect(screen.getByText(/action 2/i)).toBeInTheDocument();
    expect(screen.getByText(/action 3/i)).toBeInTheDocument();
  });
});
