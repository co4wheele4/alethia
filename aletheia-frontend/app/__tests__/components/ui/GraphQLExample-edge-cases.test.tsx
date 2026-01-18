/**
 * Edge case tests for GraphQLExample component
 * Tests "No data" case and other edge cases
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { GraphQLExample } from '../../../components/ui/GraphQLExample';
import { useHello } from '../../../hooks/useHello';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';

vi.mock('../../../hooks/useHello');

const mockUseHello = useHello as any;

const mockApolloClient = new ApolloClient({
  
  link: { request: vi.fn() } as any,
  cache: new InMemoryCache(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockApolloClient}>{children}</ApolloProvider>
);

describe('GraphQLExample Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "No data" when hello is null', () => {
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render "No data" when hello is undefined', () => {
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should render "No data" when hello is empty string', () => {
    mockUseHello.mockReturnValue({
      hello: '',
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should show loading spinner during loading', () => {
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    // Check for CircularProgress (MUI component)
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display error message correctly', () => {
    const errorMessage = 'Network error occurred';
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: { message: errorMessage } as Error,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    // Error message is displayed as "Error: {message}" in the component
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });

  it('should call refetch from error state', () => {
    const mockRefetch = vi.fn();
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: { message: 'Error' } as Error,
      refetch: mockRefetch,
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should call refetch from success state', () => {
    const mockRefetch = vi.fn();
    mockUseHello.mockReturnValue({
      hello: 'Hello World',
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    const refetchButton = screen.getByRole('button', { name: /refetch/i });
    fireEvent.click(refetchButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
