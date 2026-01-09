/**
 * Apollo Client configuration for GraphQL
 */

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
  const token = getAuthToken();
  
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

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    // Add any cache configuration here
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
