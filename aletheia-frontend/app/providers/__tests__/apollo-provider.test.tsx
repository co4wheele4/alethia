/**
 * Tests for Apollo Client Provider
 * Tests SSR/client-side behavior, error handling, and edge cases
 */

import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ApolloClientProvider } from '../apollo-provider';
import { getApolloClient } from '../../services/apollo-client';

// Mock apollo-client service
vi.mock('../../services/apollo-client', () => ({
  getApolloClient: vi.fn(),
}));

const mockGetApolloClient = getApolloClient as any;

describe('ApolloClientProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    const mockClient = {
      query: vi.fn(),
      mutate: vi.fn(),
      
    } as any;

    mockGetApolloClient.mockReturnValue(mockClient);

    render(
      <ApolloClientProvider>
        <div>Test Content</div>
      </ApolloClientProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle SSR environment', () => {
    // Use renderToString to simulate SSR instead of deleting window
    const html = renderToString(
      <ApolloClientProvider>
        <div>Content</div>
      </ApolloClientProvider>
    );

    // Should render without errors
    expect(html).toContain('Content');
  });

  it('should use getApolloClient on client side', () => {
    const mockClient = {
      query: vi.fn(),
      mutate: vi.fn(),
      
    } as any;

    mockGetApolloClient.mockReturnValue(mockClient);

    render(
      <ApolloClientProvider>
        <div>Content</div>
      </ApolloClientProvider>
    );

    // getApolloClient should be called on client side
    expect(mockGetApolloClient).toHaveBeenCalled();
  });

  it('should handle error when creating Apollo Client', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
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
      query: vi.fn(),
      mutate: vi.fn(),
      
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
