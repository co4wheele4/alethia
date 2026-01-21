/**
 * Edge case tests for StatusPill component
 * Tests all color variants, edge cases
 */

import { render, screen } from '@testing-library/react';
import { StatusPill } from '../components/StatusPill';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('StatusPill Edge Cases', () => {
  it('should render with all color variants', () => {
    const colors: Array<'default' | 'primary' | 'success' | 'warning' | 'error'> = [
      'default',
      'primary',
      'success',
      'warning',
      'error',
    ];

    colors.forEach((color) => {
      const { unmount } = render(
        <TestWrapper>
          <StatusPill status={`Status ${color}`} color={color} />
        </TestWrapper>
      );
      expect(screen.getByText(`Status ${color}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle empty string status', () => {
    const { container } = render(
      <TestWrapper>
        <StatusPill status="" />
      </TestWrapper>
    );

    // Empty string status should still render (Chip will display it)
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('should handle very long status text', () => {
    const longStatus = 'A'.repeat(100);
    render(
      <TestWrapper>
        <StatusPill status={longStatus} />
      </TestWrapper>
    );

    expect(screen.getByText(longStatus)).toBeInTheDocument();
  });

  it('should handle status with special characters', () => {
    const specialStatus = 'Status!@#$%^&*()_+-=[]{}|;:,.<>?';
    render(
      <TestWrapper>
        <StatusPill status={specialStatus} />
      </TestWrapper>
    );

    expect(screen.getByText(specialStatus)).toBeInTheDocument();
  });
});
