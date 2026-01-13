/**
 * Tests for StatusPill component
 */

import { render, screen } from '@testing-library/react';
import { StatusPill } from '../../../components/clarity/StatusPill';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('StatusPill', () => {
  it('should render with status', () => {
    render(
      <TestWrapper>
        <StatusPill status="Test Status" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Status')).toBeInTheDocument();
  });

  it('should render with default status when not provided', () => {
    render(
      <TestWrapper>
        <StatusPill />
      </TestWrapper>
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should render with different colors', () => {
    const { rerender } = render(
      <TestWrapper>
        <StatusPill status="Success" color="success" />
      </TestWrapper>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <StatusPill status="Error" color="error" />
      </TestWrapper>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
