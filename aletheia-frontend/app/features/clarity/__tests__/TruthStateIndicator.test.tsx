/**
 * Tests for TruthStateIndicator component
 */

import { render, screen } from '@testing-library/react';
import { TruthStateIndicator } from '../components/TruthStateIndicator';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('TruthStateIndicator', () => {
  it('should render with known state', () => {
    render(
      <TestWrapper>
        <TruthStateIndicator state="known" />
      </TestWrapper>
    );

    expect(screen.getByText(/known/i)).toBeInTheDocument();
  });

  it('should render with different states', () => {
    const states = ['known', 'inferred', 'user-provided', 'unverified'] as const;
    
    states.forEach(state => {
      const { unmount } = render(
        <TestWrapper>
          <TruthStateIndicator state={state} />
        </TestWrapper>
      );
      expect(screen.getByText(new RegExp(state, 'i'))).toBeInTheDocument();
      unmount();
    });
  });
});
