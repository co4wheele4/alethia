import { render, screen } from '@testing-library/react';
import { ClaimConfidenceIndicator } from '../components/ClaimConfidenceIndicator';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ClaimConfidenceIndicator', () => {
  it('renders score correctly', () => {
    render(
      <TestWrapper>
        <ClaimConfidenceIndicator score={0.85} />
      </TestWrapper>
    );

    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('handles null score', () => {
    render(
      <TestWrapper>
        <ClaimConfidenceIndicator score={null} />
      </TestWrapper>
    );

    // ConfidenceMeter should show "unknown" or empty when undefined
    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
  });

  it('clamps score between 0 and 1', () => {
    const { rerender } = render(
      <TestWrapper>
        <ClaimConfidenceIndicator score={1.5} />
      </TestWrapper>
    );
    expect(screen.getByText(/100%/)).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <ClaimConfidenceIndicator score={-0.5} />
      </TestWrapper>
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('handles score 0 correctly', () => {
    render(
      <TestWrapper>
        <ClaimConfidenceIndicator score={0} />
      </TestWrapper>
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('handles score 1 correctly', () => {
    render(
      <TestWrapper>
        <ClaimConfidenceIndicator score={1} />
      </TestWrapper>
    );
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });
});
