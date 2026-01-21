import { render, screen } from '@testing-library/react';
import { AttributionFooter } from '../components/AttributionFooter';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('AttributionFooter', () => {
  it('renders all info when provided', () => {
    render(
      <TestWrapper>
        <AttributionFooter timestamp="2023-01-01" origin="Test Origin" />
      </TestWrapper>
    );

    expect(screen.getByText(/Updated: 2023-01-01/i)).toBeInTheDocument();
    expect(screen.getByText(/Source: Test Origin/i)).toBeInTheDocument();
  });

  it('renders fallback when no info provided', () => {
    render(
      <TestWrapper>
        <AttributionFooter />
      </TestWrapper>
    );

    expect(screen.getByText(/AttributionFooter - TODO: Implement/i)).toBeInTheDocument();
  });
});
