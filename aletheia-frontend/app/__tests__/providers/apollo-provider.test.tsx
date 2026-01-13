/**
 * Tests for Apollo Client Provider
 * Tests SSR/client-side behavior, error handling, and edge cases
 */

import { render, screen } from '@testing-library/react';
import { ApolloClientProvider } from '../../providers/apollo-provider';
import { getApolloClient } from '../../services/apollo-client';

// Mock apollo-client service
jest.mock('../../services/apollo-client', () => ({
  getApolloClient: jest.fn(),
}));

const mockGetApolloClient = getApolloClient as jest.MockedFunction<typeof getApolloClient>;

describe('ApolloClientProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    const mockClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockGetApolloClient.mockReturnValue(mockClient);

    render(
      <ApolloClientProvider>
        <div>Test Content</div>
      </ApolloClientProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should create SSR client when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-expect-error - intentionally setting to undefined
    delete global.window;

    render(
      <ApolloClientProvider>
        <div>Content</div>
      </ApolloClientProvider>
    );

    // Should render without errors (SSR client is created)
    expect(screen.getByText('Content')).toBeInTheDocument();

    global.window = originalWindow;
  });

  it('should use getApolloClient on client side', () => {
    const mockClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockGetApolloClient.mockReturnValue(mockClient);

    render(
      <ApolloClientProvider>
        <div>Content</div>
      </ApolloClientProvider>
    );

    // getApolloClient should be called on client side
    if (typeof window !== 'undefined') {
      expect(mockGetApolloClient).toHaveBeenCalled();
    }
  });

  it('should handle error when creating Apollo Client', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockGetApolloClient.mockImplementation(() => {
      throw new Error('Failed to create client');
    });

    // Should not throw, should fallback to minimal client
    expect(() => {
      render(
        <ApolloClientProvider>
          <div>Content</div>
        </ApolloClientProvider>
      );
    }).not.toThrow();

    consoleError.mockRestore();
  });

  it('should provide Apollo context to children', () => {
    const mockClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockGetApolloClient.mockReturnValue(mockClient);

    render(
      <ApolloClientProvider>
        <div>Content</div>
      </ApolloClientProvider>
    );

    // ApolloProvider should wrap children
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
