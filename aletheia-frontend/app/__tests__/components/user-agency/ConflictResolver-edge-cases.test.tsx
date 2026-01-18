/**
 * Edge case tests for ConflictResolver component
 * Tests disabled button state, multiple options, edge cases
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictResolver } from '../../../components/user-agency/ConflictResolver';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('ConflictResolver Edge Cases', () => {
  it('should disable resolve button when no option is selected', () => {
    const conflict = {
      id: '1',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} />
      </TestWrapper>
    );

    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i });
    expect(resolveButton).toBeDisabled();
  });

  it('should enable resolve button when option is selected', () => {
    const conflict = {
      id: '1',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} />
      </TestWrapper>
    );

    const option1 = screen.getByLabelText(/option 1/i);
    fireEvent.click(option1);

    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i });
    expect(resolveButton).not.toBeDisabled();
  });

  it('should handle multiple options', () => {
    const conflict = {
      id: '1',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/option 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/option 3/i)).toBeInTheDocument();
  });

  it('should call onResolve with correct values when multiple options exist', () => {
    const onResolve = vi.fn();
    const conflict = {
      id: 'conflict-123',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} onResolve={onResolve} />
      </TestWrapper>
    );

    const option2 = screen.getByLabelText(/option 2/i);
    fireEvent.click(option2);

    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i });
    fireEvent.click(resolveButton);

    expect(onResolve).toHaveBeenCalledWith('conflict-123', 'option2');
  });

  it('should not call onResolve when button is disabled', () => {
    const onResolve = vi.fn();
    const conflict = {
      id: '1',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} onResolve={onResolve} />
      </TestWrapper>
    );

    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i });
    fireEvent.click(resolveButton);

    expect(onResolve).not.toHaveBeenCalled();
  });
});
