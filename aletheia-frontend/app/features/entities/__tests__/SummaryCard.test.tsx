import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../components/SummaryCard';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('SummaryCard', () => {
  it('renders title and summary when provided', () => {
    render(
      <TestWrapper>
        <SummaryCard title="Test Title" summary="Test Summary" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });

  it('renders fallback when no title provided', () => {
    render(
      <TestWrapper>
        <SummaryCard />
      </TestWrapper>
    );

    expect(screen.getByText(/SummaryCard - TODO: Implement/i)).toBeInTheDocument();
  });
});
