/**
 * Apollo Client configuration for GraphQL
 * Note: This file uses client-side APIs (localStorage) and should only be used in client components
 */

'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from, CombinedGraphQLErrors } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GRAPHQL_URL } from '../lib/constants';
import { getAuthToken } from '../lib/utils/auth';

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

// Auth Link - adds JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Only access localStorage on client side
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link - handles GraphQL errors
const errorLink = onError(({ error }) => {
  // Check if it's a GraphQL error
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((graphQLError: { message: string; locations?: unknown; path?: unknown }) => {
      const message = graphQLError.message;
      const locations = graphQLError.locations;
      const path = graphQLError.path;
      
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors
      if (message.includes('Unauthorized') || message.includes('Invalid token')) {
        // Clear token and redirect to login if needed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('aletheia_auth_token');
        }
      }
    });
  } else {
    // Network or other error
    console.error(`[Network error]: ${error}`);
  }
});

// Create Apollo Client (lazy initialization to avoid SSR issues)
let _apolloClient: ApolloClient<any> | null = null;

function createApolloClient(): ApolloClient<any> {
  // This should only be called on client side
  // The provider's useMemo ensures window is defined before calling this
  if (typeof window === 'undefined') {
    throw new Error('Apollo Client can only be created on the client side');
  }

  // Create full client with auth/error links
  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        // Define type policies for better cache management
      },
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

// Export singleton Apollo Client instance (created on first access, lazy initialization)
export function getApolloClient(): ApolloClient<any> {
  if (!_apolloClient) {
    _apolloClient = createApolloClient();
  }
  return _apolloClient;
}
