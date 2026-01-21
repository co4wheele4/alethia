import { render, screen } from '@testing-library/react';
import { ClaimScoreIndicator } from '../components/ClaimScoreIndicator';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ClaimScoreIndicator', () => {
  it('renders score as percent', () => {
    render(
      <TestWrapper>
        <ClaimScoreIndicator score={0.85} />
      </TestWrapper>
    );

    expect(screen.getByText(/model score/i)).toBeInTheDocument();
    expect(screen.getByText(/score: 85%/i)).toBeInTheDocument();
  });

  it('handles null score', () => {
    render(
      <TestWrapper>
        <ClaimScoreIndicator score={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/score: unknown/i)).toBeInTheDocument();
  });

  it('clamps score between 0 and 1', () => {
    const { rerender } = render(
      <TestWrapper>
        <ClaimScoreIndicator score={1.5} />
      </TestWrapper>
    );
    expect(screen.getByText(/score: 100%/i)).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <ClaimScoreIndicator score={-0.5} />
      </TestWrapper>
    );
    expect(screen.getByText(/score: 0%/i)).toBeInTheDocument();
  });
});

