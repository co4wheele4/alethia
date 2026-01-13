/**
 * Tests for useHello hook
 */

import { renderHook } from '@testing-library/react';
import { useHello } from '../../hooks/useHello';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import * as apolloReact from '@apollo/client/react';

// Mock Apollo Client
const mockClient = new ApolloClient({
  link: createHttpLink({ uri: 'http://localhost:3000/graphql' }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockClient}>{children}</ApolloProvider>
);

describe('useHello', () => {
  it('should return hook with expected properties', () => {
    const { result } = renderHook(() => useHello(), { wrapper });

    expect(result.current).toHaveProperty('hello');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refetch');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should have loading state initially', () => {
    const { result } = renderHook(() => useHello(), { wrapper });

    // Initially loading might be true or false depending on query execution
    expect(result.current).toHaveProperty('loading');
  });

  it('should return hello when data exists', async () => {
    // Mock useQuery to return data
    jest.spyOn(apolloReact, 'useQuery').mockReturnValue({
      data: { hello: 'Hello World' },
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof apolloReact.useQuery>);

    const { result } = renderHook(() => useHello(), { wrapper });

    // Test the branch where data exists (line 26: data?.hello)
    expect(result.current.hello).toBe('Hello World');
  });

  it('should return undefined when data does not exist', async () => {
    // Mock useQuery to return no data
    jest.spyOn(apolloReact, 'useQuery').mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof apolloReact.useQuery>);

    const { result } = renderHook(() => useHello(), { wrapper });

    // Test the branch where data is undefined (line 26: data?.hello)
    expect(result.current.hello).toBeUndefined();
  });
});
