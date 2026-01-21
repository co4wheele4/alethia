/**
 * Authentication utilities for token management
 */

import { AUTH_TOKEN_KEY } from '../../../lib/constants';

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Set the authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Remove the authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
