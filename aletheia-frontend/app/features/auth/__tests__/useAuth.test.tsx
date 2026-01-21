/**
 * Unit tests for useAuth hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useAuth } from '../hooks/useAuth';
import * as authUtils from '../utils/auth';

// Mock the auth utils
vi.mock('../utils/auth', () => ({
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
}));

// Mock Apollo Client
const mockClient = new ApolloClient({
  
  link: { request: vi.fn() } as any,
  cache: new InMemoryCache(),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockClient}>{children}</ApolloProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authUtils.getAuthToken as any).mockReturnValue(null);
    localStorage.clear();
  });

  it('should initialize with no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should initialize with token from localStorage', async () => {
    const mockToken = 'mock-token';
    (authUtils.getAuthToken as any).mockReturnValue(mockToken);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for requestAnimationFrame to complete and state to update
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should call logout and clear token', () => {
    const mockToken = 'mock-token';
    (authUtils.getAuthToken as any).mockReturnValue(mockToken);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });
    
    expect(authUtils.removeAuthToken).toHaveBeenCalled();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle login mutation', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Note: This is a basic test structure
    // Full integration would require mocking the Apollo mutation
    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe('function');
  });

  it('should handle register mutation', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Note: This is a basic test structure
    // Full integration would require mocking the Apollo mutation
    expect(result.current.register).toBeDefined();
    expect(typeof result.current.register).toBe('function');
  });

  it('should handle changePassword function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.changePassword).toBeDefined();
    expect(typeof result.current.changePassword).toBe('function');
  });

  it('should handle forgotPassword function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.forgotPassword).toBeDefined();
    expect(typeof result.current.forgotPassword).toBe('function');
  });

  it('should return isInitialized state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current).toHaveProperty('isInitialized');
    expect(typeof result.current.isInitialized).toBe('boolean');
  });
});
