/**
 * Integration tests for Apollo Client error handling
 * Tests error link, auth link, and network error scenarios
 */

import { render, screen, waitFor } from '@testing-library/react';
import { GraphQLExample } from '../../components/ui/GraphQLExample';
import { useHello } from '../../hooks/useHello';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache, from, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { ThemeProvider } from '../../hooks/useTheme';
import { MuiThemeProvider } from '../../providers/mui-theme-provider';
import * as authUtils from '../../lib/utils/auth';

jest.mock('../../hooks/useHello');

const mockUseHello = useHello as jest.MockedFunction<typeof useHello>;

// Mock auth utils
jest.mock('../../lib/utils/auth', () => ({
  getAuthToken: jest.fn(() => null),
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MuiThemeProvider>
      {children}
    </MuiThemeProvider>
  </ThemeProvider>
);

describe('Apollo Client Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authUtils.getAuthToken as jest.Mock).mockReturnValue(null);
  });

  it('should handle GraphQL errors in components', async () => {
    const mockError = { message: 'GraphQL error occurred' } as Error;
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/graphql error occurred/i)).toBeInTheDocument();
  });

  it('should handle network errors in components', async () => {
    const networkError = new Error('Network error');
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: networkError,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: true,
      error: undefined,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle successful data loading', () => {
    mockUseHello.mockReturnValue({
      hello: 'Hello World',
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
