import { render, screen } from '@testing-library/react';
import { ClaimList } from '../components/ClaimList';
import { ThemeProvider } from '../../../hooks/useTheme';

const mockClaims = [
  {
    id: '1',
    answer: 'Answer 1',
    query: {
      id: 'q1',
      query: 'Query 1',
      createdAt: '2023-01-01T12:00:00Z',
    },
  },
  {
    id: '2',
    answer: 'Answer 2',
    query: {
      id: 'q2',
      query: 'Query 2',
      createdAt: '2023-01-02T12:00:00Z',
    },
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ClaimList', () => {
  it('renders a list of claims', () => {
    render(
      <TestWrapper>
        <ClaimList claims={mockClaims as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Query 2')).toBeInTheDocument();
  });

  it('renders empty message when no claims', () => {
    render(
      <TestWrapper>
        <ClaimList claims={[]} />
      </TestWrapper>
    );

    expect(screen.getByText(/No AI outputs yet/i)).toBeInTheDocument();
  });
});
