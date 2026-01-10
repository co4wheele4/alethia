/**
 * Authentication hook for managing user authentication
 */

'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../lib/graphql/queries';
import { setAuthToken, removeAuthToken, getAuthToken, isAuthenticated } from '../lib/utils/auth';

interface LoginVariables {
  email: string;
  password: string;
}

interface LoginData {
  login: string; // Returns the JWT token
}

interface RegisterVariables {
  email: string;
  name?: string;
}

interface RegisterData {
  register: string; // Returns the JWT token
}

export function useAuth() {
  // Initialize token from localStorage on mount
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation<
    LoginData,
    LoginVariables
  >(LOGIN_MUTATION, {
    onCompleted: (data: LoginData) => {
      const authToken = data.login;
      setAuthToken(authToken);
      setToken(authToken);
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
    },
    onError: (error: Error) => {
      console.error('Register error:', error);
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

  const register = async (email: string, name?: string) => {
    try {
      const result = await registerMutation({
        variables: { email, name },
      });
      return result.data?.register;
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
    register,
    logout,
    loading: loginLoading || registerLoading,
    error: loginError || registerError,
  };
}
