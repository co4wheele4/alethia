/**
 * Tests for SnapshotViewer component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SnapshotViewer } from '../../../components/dev/SnapshotViewer';

describe('SnapshotViewer', () => {
  it('should render title', () => {
    render(<SnapshotViewer />);
    expect(screen.getByText('State Snapshot (Dev Mode)')).toBeInTheDocument();
  });

  it('should render empty state when no snapshot', () => {
    render(<SnapshotViewer />);
    expect(screen.getByText('No snapshot available')).toBeInTheDocument();
  });

  it('should render snapshot when provided', () => {
    const snapshot = { state: 'test', value: 123 };
    render(<SnapshotViewer snapshot={snapshot} />);
    
    expect(screen.getByText(/"state":\s*"test"/)).toBeInTheDocument();
    expect(screen.getByText(/"value":\s*123/)).toBeInTheDocument();
  });

  it('should render take snapshot button when onTakeSnapshot is provided', () => {
    const handleSnapshot = vi.fn();
    render(<SnapshotViewer onTakeSnapshot={handleSnapshot} />);
    
    expect(screen.getByRole('button', { name: /take snapshot/i })).toBeInTheDocument();
  });

  it('should not render take snapshot button when onTakeSnapshot is not provided', () => {
    render(<SnapshotViewer />);
    expect(screen.queryByRole('button', { name: /take snapshot/i })).not.toBeInTheDocument();
  });

  it('should call onTakeSnapshot when button is clicked', () => {
    const handleSnapshot = vi.fn();
    render(<SnapshotViewer onTakeSnapshot={handleSnapshot} />);
    
    const button = screen.getByRole('button', { name: /take snapshot/i });
    fireEvent.click(button);
    
    expect(handleSnapshot).toHaveBeenCalledTimes(1);
  });
});
