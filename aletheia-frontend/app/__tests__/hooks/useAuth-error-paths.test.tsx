/**
 * Error path tests for useAuth hook
 * Tests all error handling paths and edge cases
 */

import { renderHook, act } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { Observable } from 'rxjs';
import { useAuth } from '../../hooks/useAuth';
import * as authUtils from '../../lib/utils/auth';
import { GraphQLError } from 'graphql';

// Mock the auth utils
jest.mock('../../lib/utils/auth', () => ({
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
  getAuthToken: jest.fn(() => null),
}));

// Mock Apollo Client with error scenarios
// Apollo Link must return an Observable
/* eslint-disable @typescript-eslint/no-explicit-any */
const createMockLink = (scenario: string) => {
  return new ApolloLink((operation: any) => {
    return new Observable((observer: any) => {
      const { operationName } = operation;

      try {
        if (scenario === 'network-error') {
          const error = new Error('Network error');
           
          (error as any).graphQLErrors = [];
           
          (error as any).networkError = new Error('Network request failed');
          observer.error(error);
          return;
        }

        if (scenario === 'graphql-error') {
          const error = new Error('GraphQL error occurred');
           
          (error as any).graphQLErrors = [new GraphQLError('GraphQL error occurred')];
           
          (error as any).networkError = null;
          observer.error(error);
          return;
        }

        if (scenario === 'unauthorized') {
          const error = new Error('Unauthorized');
           
          (error as any).graphQLErrors = [new GraphQLError('Unauthorized')];
           
          (error as any).networkError = null;
          observer.error(error);
          return;
        }

        if (scenario === 'invalid-token') {
          const error = new Error('Invalid token');
           
          (error as any).graphQLErrors = [new GraphQLError('Invalid token')];
           
          (error as any).networkError = null;
          observer.error(error);
          return;
        }

        if (scenario === 'login-invalid-password') {
          if (operationName === 'Login') {
            const error = new Error('Invalid email or password');
             
            (error as any).graphQLErrors = [new GraphQLError('Invalid email or password')];
             
            (error as any).networkError = null;
            observer.error(error);
            return;
          }
        }

        if (scenario === 'register-email-exists') {
          if (operationName === 'Register') {
            const error = new Error('Email already exists');
             
            (error as any).graphQLErrors = [new GraphQLError('Email already exists')];
             
            (error as any).networkError = null;
            observer.error(error);
            return;
          }
        }

        if (scenario === 'change-password-incorrect') {
          if (operationName === 'ChangePassword') {
            const error = new Error('Current password is incorrect');
             
            (error as any).graphQLErrors = [new GraphQLError('Current password is incorrect')];
             
            (error as any).networkError = null;
            observer.error(error);
            return;
          }
        }

        if (scenario === 'forgot-password-not-found') {
          if (operationName === 'ForgotPassword') {
            const error = new Error('No account found with this email address');
             
            (error as any).graphQLErrors = [new GraphQLError('No account found with this email address')];
             
            (error as any).networkError = null;
            observer.error(error);
            return;
          }
        }

        // Default success
        if (operationName === 'Login') {
          observer.next({ data: { login: 'mock-jwt-token' } });
          observer.complete();
          return;
        }
        if (operationName === 'Register') {
          observer.next({ data: { register: 'mock-jwt-token' } });
          observer.complete();
          return;
        }
        if (operationName === 'ChangePassword') {
          observer.next({ data: { changePassword: true } });
          observer.complete();
          return;
        }
        if (operationName === 'ForgotPassword') {
          observer.next({ data: { forgotPassword: true } });
          observer.complete();
          return;
        }

        observer.next({ data: null });
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  });
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const createMockClient = (scenario: string) => {
  return new ApolloClient({
    link: createMockLink(scenario),
    cache: new InMemoryCache(),
  });
};

const wrapper = (scenario: string) => {
  const WrapperComponent = ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={createMockClient(scenario)}>{children}</ApolloProvider>
  );
  WrapperComponent.displayName = 'WrapperComponent';
  return WrapperComponent;
};

describe('useAuth Error Paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authUtils.getAuthToken as jest.Mock).mockReturnValue(null);
    localStorage.clear();
  });

  it('should handle network errors in login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('network-error') });

    await act(async () => {
      await expect(result.current.login('test@example.com', 'password')).rejects.toThrow(/network/i);
    });
  });

  it('should handle GraphQL errors in login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('graphql-error') });

    await act(async () => {
      await expect(result.current.login('test@example.com', 'password')).rejects.toThrow();
    });
  });

  it('should handle invalid password errors in login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('login-invalid-password') });

    await act(async () => {
      await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow(/invalid email or password/i);
    });
  });

  it('should handle email already exists in register', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('register-email-exists') });

    await act(async () => {
      await expect(result.current.register('existing@example.com', 'Password123!')).rejects.toThrow(/email already exists/i);
    });
  });

  it('should handle network errors in register', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('network-error') });

    await act(async () => {
      await expect(result.current.register('test@example.com', 'Password123!')).rejects.toThrow(/network/i);
    });
  });

  it('should handle incorrect current password in changePassword', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('change-password-incorrect') });

    await act(async () => {
      await expect(result.current.changePassword('wrongpass', 'NewPass123!')).rejects.toThrow(/current password is incorrect/i);
    });
  });

  it('should handle network errors in changePassword', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('network-error') });

    await act(async () => {
      await expect(result.current.changePassword('OldPass123!', 'NewPass123!')).rejects.toThrow(/network/i);
    });
  });

  it('should handle email not found in forgotPassword', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('forgot-password-not-found') });

    await act(async () => {
      await expect(result.current.forgotPassword('nonexistent@example.com')).rejects.toThrow(/no account found/i);
    });
  });

  it('should handle network errors in forgotPassword', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper('network-error') });

    await act(async () => {
      await expect(result.current.forgotPassword('test@example.com')).rejects.toThrow(/network/i);
    });
  });

  it('should handle login with null data response', async () => {
     
    const mockLink = new ApolloLink(() => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return new Observable((observer: any) => {
        observer.next({ data: { login: null } });
        observer.complete();
      });
    });
    const mockClient = new ApolloClient({
      link: mockLink,
      cache: new InMemoryCache(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <ApolloProvider client={mockClient}>{children}</ApolloProvider>,
    });

    await act(async () => {
      // When login data is null, it throws "Login failed: Invalid email or password"
      await expect(result.current.login('test@example.com', 'password')).rejects.toThrow(/login failed|invalid email or password/i);
    });
  });

  it('should handle register with null data response', async () => {
     
    const mockLink = new ApolloLink(() => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return new Observable((observer: any) => {
        observer.next({ data: { register: null } });
        observer.complete();
      });
    });
    const mockClient = new ApolloClient({
      link: mockLink,
      cache: new InMemoryCache(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <ApolloProvider client={mockClient}>{children}</ApolloProvider>,
    });

    await act(async () => {
      await expect(result.current.register('test@example.com', 'Password123!')).rejects.toThrow(/registration failed/i);
    });
  });

  it('should handle changePassword with null data response', async () => {
     
    const mockLink = new ApolloLink(() => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return new Observable((observer: any) => {
        observer.next({ data: { changePassword: null } });
        observer.complete();
      });
    });
    const mockClient = new ApolloClient({
      link: mockLink,
      cache: new InMemoryCache(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <ApolloProvider client={mockClient}>{children}</ApolloProvider>,
    });

    await act(async () => {
      await expect(result.current.changePassword('OldPass123!', 'NewPass123!')).rejects.toThrow(/password change failed/i);
    });
  });

  it('should handle forgotPassword with null data response', async () => {
     
    const mockLink = new ApolloLink(() => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return new Observable((observer: any) => {
        observer.next({ data: { forgotPassword: null } });
        observer.complete();
      });
    });
    const mockClient = new ApolloClient({
      link: mockLink,
      cache: new InMemoryCache(),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <ApolloProvider client={mockClient}>{children}</ApolloProvider>,
    });

    await act(async () => {
      await expect(result.current.forgotPassword('test@example.com')).rejects.toThrow(/failed to send password reset email/i);
    });
  });
});
