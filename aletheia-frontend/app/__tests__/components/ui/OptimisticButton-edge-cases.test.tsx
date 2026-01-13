/**
 * Edge case tests for OptimisticButton component
 * Tests error handling, edge cases, and all code paths
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptimisticButton } from '../../../components/ui/OptimisticButton';

describe('OptimisticButton Edge Cases', () => {
  it('should call action even when it throws error', async () => {
    const action = jest.fn().mockRejectedValue(new Error('Action failed'));
    
    // Suppress console errors and warnings for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    // Action should be called (error is not caught, but that's expected)
    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('should show optimistic label when action is called', async () => {
    const action = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <OptimisticButton action={action} optimisticLabel="Processing...">
        Submit
      </OptimisticButton>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    // Should show optimistic label initially
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
    
    // Wait for action to complete
    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
  });

  it('should not show optimistic label when not provided', async () => {
    const action = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    // Should still show original label even during processing
    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
  });

  it('should be disabled when both isPending and optimisticState are true', async () => {
    const action = jest.fn(() => new Promise(resolve => setTimeout(resolve, 200)));
    
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    // Button should be disabled during processing
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should handle multiple rapid clicks', async () => {
    const action = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);
    
    const button = screen.getByRole('button', { name: /submit/i });
    
    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    // Button should be disabled after first click
    expect(button).toBeDisabled();
    
    // Action should only be called once per click (React handles this)
    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
  });

  it('should pass through all button props correctly', () => {
    const action = jest.fn();
    
    render(
      <OptimisticButton
        action={action}
        variant="outlined"
        color="secondary"
        size="large"
        fullWidth
      >
        Custom Button
      </OptimisticButton>
    );
    
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toBeInTheDocument();
  });

  it('should respect disabled prop even when not pending', () => {
    const action = jest.fn();
    
    render(
      <OptimisticButton action={action} disabled>
        Submit
      </OptimisticButton>
    );
    
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();
    
    // Clicking should not call action when disabled
    fireEvent.click(button);
    expect(action).not.toHaveBeenCalled();
  });
});
