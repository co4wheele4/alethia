/**
 * Authentication hook for managing user authentication
 */

'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION, REGISTER_MUTATION, CHANGE_PASSWORD_MUTATION, FORGOT_PASSWORD_MUTATION } from '../lib/graphql/queries';
import { setAuthToken, removeAuthToken, getAuthToken } from '../lib/utils/auth';

interface LoginVariables {
  email: string;
  password: string;
}

interface LoginData {
  login: string; // Returns the JWT token
}

interface RegisterVariables {
  email: string;
  password: string;
  name?: string;
}

interface RegisterData {
  register: string; // Returns the JWT token
}

interface ChangePasswordVariables {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordData {
  changePassword: boolean; // Returns success status
}

interface ForgotPasswordVariables {
  email: string;
}

interface ForgotPasswordData {
  forgotPassword: boolean; // Returns success status
}

export function useAuth() {
  // Initialize token from localStorage on mount (only on client side)
  const [token, setToken] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize auth state on client-side mount to prevent hydration mismatch
  // Using useEffect to access localStorage only on client side
  useEffect(() => {
    // Initialize auth state from localStorage (client-side only)
    const authToken = getAuthToken();
    setToken(authToken);
    setIsAuth(authToken !== null);
    setIsInitialized(true);
  }, []); // Empty deps: only run on mount to initialize from localStorage

  const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation<
    LoginData,
    LoginVariables
  >(LOGIN_MUTATION, {
    onCompleted: (data: LoginData) => {
      const authToken = data.login;
      setAuthToken(authToken);
      setToken(authToken);
      setIsAuth(true);
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
    },
  });

  const [registerMutation, { loading: registerLoading, error: registerError }] = useMutation<
    RegisterData,
    RegisterVariables
  >(REGISTER_MUTATION, {
    onCompleted: (data: RegisterData) => {
      const authToken = data.register;
      setAuthToken(authToken);
      setToken(authToken);
      setIsAuth(true);
    },
    onError: (error: Error) => {
      console.error('Register error:', error);
    },
  });

  const [changePasswordMutation, { loading: changePasswordLoading, error: changePasswordError }] = useMutation<
    ChangePasswordData,
    ChangePasswordVariables
  >(CHANGE_PASSWORD_MUTATION, {
    onError: (error: Error) => {
      console.error('Change password error:', error);
    },
  });

  const [forgotPasswordMutation, { loading: forgotPasswordLoading, error: forgotPasswordError }] = useMutation<
    ForgotPasswordData,
    ForgotPasswordVariables
  >(FORGOT_PASSWORD_MUTATION, {
    onError: (error: Error) => {
      console.error('Forgot password error:', error);
    },
  });

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({
        variables: { email, password },
      });
      
      if (!result.data?.login) {
        throw new Error('Login failed: Invalid email or password');
      }
      
      return result.data.login;
    } catch (error: unknown) {
      // Extract error message from GraphQL error
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        const graphQLError = (error as { graphQLErrors: Array<{ message: string }> }).graphQLErrors[0];
        if (graphQLError) {
          const message = graphQLError.message.toLowerCase();
          if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong') || message.includes('password')) {
            throw new Error('Invalid email or password');
          }
          throw new Error(graphQLError.message);
        }
      }
      
      // Check network errors
      if (error && typeof error === 'object' && 'networkError' in error) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Check for error message in standard error format
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong') || message.includes('password')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }
      
      // This fallback is for non-Error instances, which Apollo Client doesn't produce in practice
      // istanbul ignore next
      throw new Error('Login failed. Please try again.');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const result = await registerMutation({
        variables: { email, password, name },
      });
      
      if (!result.data?.register) {
        throw new Error('Registration failed: Unable to create account');
      }
      
      return result.data.register;
    } catch (error) {
      // Re-throw with more context if needed
      if (error instanceof Error) {
        throw error;
      }
      // @ts-expect-error - Defensive fallback for non-Error instances (unreachable with Apollo Client)
      // istanbul ignore next
      throw new Error('Registration failed. Please try again.');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const result = await changePasswordMutation({
        variables: { currentPassword, newPassword },
      });
      
      if (!result.data?.changePassword) {
        throw new Error('Password change failed');
      }
      
      return true;
    } catch (error: unknown) {
      // Extract error message from GraphQL error
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        const graphQLError = (error as { graphQLErrors: Array<{ message: string }> }).graphQLErrors[0];
        if (graphQLError) {
          const message = graphQLError.message.toLowerCase();
          if (message.includes('incorrect') || message.includes('invalid') || message.includes('wrong') || message.includes('current password')) {
            throw new Error('Current password is incorrect');
          }
          throw new Error(graphQLError.message);
        }
      }
      
      // Check network errors
      if (error && typeof error === 'object' && 'networkError' in error) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Check for error message in standard error format
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('incorrect') || message.includes('invalid') || message.includes('wrong') || message.includes('current password')) {
          throw new Error('Current password is incorrect');
        }
        throw error;
      }
      
      // @ts-expect-error - Defensive fallback for non-Error instances (unreachable with Apollo Client)
      // istanbul ignore next
      throw new Error('Failed to change password. Please try again.');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const result = await forgotPasswordMutation({
        variables: { email },
      });
      
      if (!result.data?.forgotPassword) {
        throw new Error('Failed to send password reset email');
      }
      
      return true;
    } catch (error: unknown) {
      // Extract error message from GraphQL error
      if (error && typeof error === 'object' && 'graphQLErrors' in error) {
        const graphQLError = (error as { graphQLErrors: Array<{ message: string }> }).graphQLErrors[0];
        if (graphQLError) {
          /* istanbul ignore next */ const message = graphQLError.message.toLowerCase(); // Defensive code path, Apollo Client error structure may prevent this from being reached in practice
          if (message.includes('not found') || message.includes('does not exist') || message.includes('no user')) {
            throw new Error('No account found with this email address');
          }
          throw new Error(graphQLError.message);
        }
      }
      
      // Check network errors
      if (error && typeof error === 'object' && 'networkError' in error) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Check for error message in standard error format
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('not found') || message.includes('does not exist') || message.includes('no user')) {
          throw new Error('No account found with this email address');
        }
        throw error;
      }
      
      // @ts-expect-error - Defensive fallback for non-Error instances (unreachable with Apollo Client)
      // istanbul ignore next
      throw new Error('Failed to send password reset email. Please try again.');
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setIsAuth(false);
  };

  return {
    token,
    isAuthenticated: isAuth,
    isInitialized,
    login,
    register,
    changePassword,
    forgotPassword,
    logout,
    loading: loginLoading || registerLoading || changePasswordLoading || forgotPasswordLoading,
    error: loginError || registerError || changePasswordError || forgotPasswordError,
  };
}
