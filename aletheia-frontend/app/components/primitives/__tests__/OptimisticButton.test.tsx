/**
 * Tests for OptimisticButton component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OptimisticButton } from '../OptimisticButton';

describe('OptimisticButton', () => {
  it('should render button with children', () => {
    const action = vi.fn();
    render(<OptimisticButton action={action}>Click Me</OptimisticButton>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call action when clicked', async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<OptimisticButton action={action}>Click Me</OptimisticButton>);

    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
  });

  it('should show optimistic label while pending', async () => {
    const action = vi.fn<() => Promise<void>>(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(
      <OptimisticButton action={action} optimisticLabel="Processing...">
        Submit
      </OptimisticButton>
    );

    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  it('should show children when optimisticState is false', () => {
    // Test the branch where optimisticState is false (line 49: optimisticState && optimisticLabel ? optimisticLabel : children)
    const action = vi.fn();
    render(
      <OptimisticButton action={action} optimisticLabel="Processing...">
        Submit
      </OptimisticButton>
    );

    // Initially, optimisticState is false, so should show children
    expect(screen.getByText(/submit/i)).toBeInTheDocument();
    expect(screen.queryByText(/processing/i)).not.toBeInTheDocument();
  });

  it('should show children when optimisticLabel is not provided', async () => {
    // Test the branch where optimisticLabel is undefined (line 49)
    const action = vi.fn<() => Promise<void>>(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(
      <OptimisticButton action={action}>
        Submit
      </OptimisticButton>
    );

    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);

    // Even when optimisticState is true, if optimisticLabel is not provided, show children
    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
  });

  it('should be disabled while pending', async () => {
    const action = vi.fn<() => Promise<void>>(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);

    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should be disabled when optimisticState is true', async () => {
    // Test the branch where optimisticState is true (line 47: disabled={isPending || optimisticState || buttonProps.disabled})
    const action = vi.fn<() => Promise<void>>(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<OptimisticButton action={action}>Submit</OptimisticButton>);

    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);

    // Button should be disabled due to optimisticState being true
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should respect disabled prop', () => {
    const action = vi.fn();
    render(
      <OptimisticButton action={action} disabled>
        Submit
      </OptimisticButton>
    );

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();
  });

  it('should pass through other button props', () => {
    const action = vi.fn();
    render(
      <OptimisticButton action={action} variant="outlined" color="primary">
        Submit
      </OptimisticButton>
    );

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
  });
});
