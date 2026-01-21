/**
 * Tests for SystemStatusPanel component
 */

import { render, screen } from '@testing-library/react';
import { SystemStatusPanel } from '../components/SystemStatusPanel';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('SystemStatusPanel', () => {
  it('should render with status and message', () => {
    render(
      <TestWrapper>
        <SystemStatusPanel status="healthy" message="All systems operational" />
      </TestWrapper>
    );

    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });

  it('should render with different statuses', () => {
    const { rerender } = render(
      <TestWrapper>
        <SystemStatusPanel status="healthy" message="OK" />
      </TestWrapper>
    );

    expect(screen.getByText('OK')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <SystemStatusPanel status="degraded" message="Warning" />
      </TestWrapper>
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });
});
