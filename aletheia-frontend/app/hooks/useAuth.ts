/**
 * Authentication hook for managing user authentication
 */

'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../lib/graphql/queries';
import { setAuthToken, removeAuthToken, getAuthToken, isAuthenticated } from '../lib/utils/auth';

interface LoginVariables {
  email: string;
  password: string;
}

interface LoginData {
  login: string; // Returns the JWT token
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const existingToken = getAuthToken();
    setToken(existingToken);
    setLoading(false);
  }, []);

  const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation<
    LoginData,
    LoginVariables
  >(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const authToken = data.login;
      setAuthToken(authToken);
      setToken(authToken);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation({
        variables: { email, password },
      });
      return result.data?.login;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
  };

  return {
    token,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    loading: loading || loginLoading,
    error: loginError,
  };
}
