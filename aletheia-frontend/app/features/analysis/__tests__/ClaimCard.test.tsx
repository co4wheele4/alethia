import { render, screen } from '@testing-library/react';
import { ClaimCard } from '../components/ClaimCard';
import { ThemeProvider } from '../../../hooks/useTheme';

const mockClaim = {
  id: '1',
  answer: 'Test answer',
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

});
