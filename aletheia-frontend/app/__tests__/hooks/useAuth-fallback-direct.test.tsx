/**
 * Direct mutation mock tests for unreachable fallback paths in useAuth
 * These tests mock useMutation directly to throw non-Error values
 */

import { renderHook, act } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useAuth } from '../../hooks/useAuth';
import * as authUtils from '../../lib/utils/auth';

// Mock the auth utils
vi.mock('../../lib/utils/auth', () => ({
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
}));

// Mock useMutation to return mutations that throw non-Error values
vi.mock('@apollo/client/react', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useMutation: () => {
      // Return a mutation function that throws a plain object (not an Error instance)
      const mutationFn = async () => {
        // Throw a plain object to trigger fallback paths
        
        const nonErrorObj: any = { message: 'Unexpected error', toString: () => 'Unexpected error' };
        Object.setPrototypeOf(nonErrorObj, null);
        throw nonErrorObj;
      };
      return [mutationFn, { loading: false, error: null }];
    },
  };
});

const mockClient = new ApolloClient({
  
  link: { request: vi.fn() } as any,
  cache: new InMemoryCache(),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockClient}>{children}</ApolloProvider>
);

describe('useAuth Fallback Paths (Direct Mock)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authUtils.getAuthToken as any).mockReturnValue(null);
    localStorage.clear();
  });

  it('should handle non-Error instance fallback in login (line 150)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // This should trigger the fallback at line 150
      await expect(result.current.login('test@example.com', 'password')).rejects.toThrow(/login failed/i);
    });
  });

  it('should handle non-Error instance fallback in register (line 170)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // This should trigger the fallback at line 170
      await expect(result.current.register('test@example.com', 'Password123!')).rejects.toThrow(/registration failed/i);
    });
  });

  it('should handle non-Error instance fallback in changePassword (line 212)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // This should trigger the fallback at line 212
      await expect(result.current.changePassword('OldPass123!', 'NewPass123!')).rejects.toThrow(/failed to change password/i);
    });
  });

  it('should handle non-Error instance fallback in forgotPassword (line 254)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      // This should trigger the fallback at line 254
      await expect(result.current.forgotPassword('test@example.com')).rejects.toThrow(/failed to send password reset email/i);
    });
  });
});
