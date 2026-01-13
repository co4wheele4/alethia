/**
 * Tests for ExplanationModal component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ExplanationModal } from '../../../components/clarity/ExplanationModal';

describe('ExplanationModal', () => {
  it('should not render when closed', () => {
    render(<ExplanationModal open={false} />);
    expect(screen.queryByText('Explanation')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<ExplanationModal open={true} />);
    expect(screen.getByText('Explanation')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ExplanationModal open={true} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render empty state when no steps', () => {
    render(<ExplanationModal open={true} />);
    expect(screen.getByText('TODO: Implement explanation steps')).toBeInTheDocument();
  });

  it('should render steps', () => {
    const steps = [
      { step: 1, description: 'First step' },
      { step: 2, description: 'Second step' },
    ];

    render(<ExplanationModal open={true} steps={steps} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<ExplanationModal open={true} onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should work without onClose handler', () => {
    render(<ExplanationModal open={true} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    expect(() => {
      fireEvent.click(closeButton);
    }).not.toThrow();
  });
});
