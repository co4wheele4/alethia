/**
 * Tests for GraphQLExample component
 */

import { render, screen } from '@testing-library/react';
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
TestWrapper.displayName = 'TestWrapper';

describe('GraphQLExample', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
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

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    const mockError = { message: 'GraphQL error' } as Error;
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/graphql error/i)).toBeInTheDocument();
  });

  it('should render data when loaded', () => {
    mockUseHello.mockReturnValue({
      hello: 'Hello World',
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', () => {
    const mockRefetch = vi.fn();
    const mockError = { message: 'Error' } as Error;
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: mockError,
      refetch: mockRefetch,
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should call refetch when refetch button is clicked', () => {
    const mockRefetch = vi.fn();
    mockUseHello.mockReturnValue({
      hello: 'Hello',
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
    refetchButton.click();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show "No data" when hello is undefined', () => {
    // Test the branch where hello is undefined/null (line 42: hello || 'No data')
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

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('should show "No data" when hello is null', () => {
    // Test the branch where hello is null (line 42: hello || 'No data')
    mockUseHello.mockReturnValue({
      
      hello: null as any,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
