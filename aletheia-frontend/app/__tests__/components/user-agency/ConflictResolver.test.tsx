/**
 * Tests for ConflictResolver component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictResolver } from '../../../components/user-agency/ConflictResolver';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('ConflictResolver', () => {
  it('should render TODO when no conflict', () => {
    render(
      <TestWrapper>
        <ConflictResolver />
      </TestWrapper>
    );

    expect(screen.getByText(/todo/i)).toBeInTheDocument();
  });

  it('should render conflict when provided', () => {
    const conflict = {
      id: '1',
      description: 'Test conflict',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ],
    };

    render(
      <TestWrapper>
        <ConflictResolver conflict={conflict} />
      </TestWrapper>
    );

    expect(screen.getByText(/test conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/option 1/i)).toBeInTheDocument();
    expect(screen.getByText(/option 2/i)).toBeInTheDocument();
  });

  it('should call onResolve when button is clicked', () => {
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

    const option1 = screen.getByLabelText(/option 1/i);
    fireEvent.click(option1);

    const resolveButton = screen.getByRole('button', { name: /resolve conflict/i });
    fireEvent.click(resolveButton);

    expect(onResolve).toHaveBeenCalledWith('1', 'option1');
  });
});
