/**
 * Application constants
 */

export const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Token storage key
export const AUTH_TOKEN_KEY = 'aletheia_auth_token';
