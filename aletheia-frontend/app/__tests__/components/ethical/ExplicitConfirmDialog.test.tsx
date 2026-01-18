/**
 * Tests for ExplicitConfirmDialog component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ExplicitConfirmDialog } from '../../../components/ethical/ExplicitConfirmDialog';

describe('ExplicitConfirmDialog', () => {
  it('should not render when closed', () => {
    render(<ExplicitConfirmDialog open={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<ExplicitConfirmDialog open={true} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('should render with default message', () => {
    render(<ExplicitConfirmDialog open={true} />);
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ExplicitConfirmDialog open={true} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<ExplicitConfirmDialog open={true} message="Custom message" />);
    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('should render with custom button labels', () => {
    render(
      <ExplicitConfirmDialog
        open={true}
        confirmLabel="Yes, proceed"
        cancelLabel="No, cancel"
      />
    );
    expect(screen.getByRole('button', { name: /yes, proceed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no, cancel/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(<ExplicitConfirmDialog open={true} onConfirm={handleConfirm} />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(<ExplicitConfirmDialog open={true} onClose={handleClose} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should work without handlers', () => {
    render(<ExplicitConfirmDialog open={true} />);
    
    expect(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);
    }).not.toThrow();
  });
});
