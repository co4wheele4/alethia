import { render, screen } from '@testing-library/react';
import { ClaimCard } from '../components/ClaimCard';
import { ThemeProvider } from '../../../hooks/useTheme';

const mockClaim = {
  id: '1',
  answer: 'Test answer',
  score: 0.85,
  query: {
    id: 'q1',
    query: 'Test query',
    createdAt: '2023-01-01T12:00:00Z',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ClaimCard', () => {
  it('renders claim details correctly', () => {
    render(
      <TestWrapper>
        <ClaimCard claim={mockClaim as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Test query')).toBeInTheDocument();
    expect(screen.getByText('Test answer')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated hypothesis/i)).toBeInTheDocument();
  });

  it('renders model score indicator', () => {
    render(
      <TestWrapper>
        <ClaimCard claim={mockClaim as any} />
      </TestWrapper>
    );

    expect(screen.getByText(/model score/i)).toBeInTheDocument();
  });

  it('handles missing score', () => {
    const claimNoScore = { ...mockClaim, score: null };
    render(
      <TestWrapper>
        <ClaimCard claim={claimNoScore as any} />
      </TestWrapper>
    );

    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
  });

  it('handles undefined score', () => {
    const claimUndefinedScore = { ...mockClaim, score: undefined };
    render(
      <TestWrapper>
        <ClaimCard claim={claimUndefinedScore as any} />
      </TestWrapper>
    );

    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
  });
});
