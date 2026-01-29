/**
 * Apollo Client configuration for GraphQL
 * Note: This file uses client-side APIs (localStorage) and should only be used in client components
 */

'use client';

import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, from, CombinedGraphQLErrors } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { Observable } from '@apollo/client/utilities';
import { GRAPHQL_URL } from '../lib/constants';
import { getAuthToken } from '../features/auth/utils/auth';

function assertNoConfidence(value: unknown, path = 'root', seen = new Set<object>()) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoConfidence(value[i], `${path}[${i}]`, seen);
    }
    return;
  }

  if (typeof value !== 'object') return;
  if (seen.has(value as object)) return;
  seen.add(value as object);

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k.toLowerCase() === 'confidence') {
      throw new Error(`[GraphQL contract] Unexpected field "confidence" at ${path}.${k}`);
    }
    assertNoConfidence(v, `${path}.${k}`, seen);
  }
}

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

// Auth Link - adds JWT token to requests
export const authLink = setContext((_, { headers }) => {
  // Only access localStorage on client side
  /* v8 ignore start */
  const token = typeof window !== 'undefined' ? getAuthToken() : null; // window is always defined in JSDOM, so false branch is untestable
  /* v8 ignore stop */
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link - handles GraphQL errors
// Export the handler function for testing
export const errorLinkHandler = (error: unknown) => {
  /* v8 ignore start */
  // Check if it's a GraphQL error
  if (CombinedGraphQLErrors.is(error)) {
    const cge = error as CombinedGraphQLErrors;
    // Ensure errors array exists and has items
    if (cge.errors && cge.errors.length > 0) {
      cge.errors.forEach((graphQLError: { message: string; locations?: unknown; path?: unknown }) => {
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
    }
  } else {
    // Network or other error
    console.error(`[Network error]: ${error}`);
  }
  /* v8 ignore stop */
};

export const errorLink = onError(({ error }) => {
  errorLinkHandler(error);
});

const noConfidenceLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const sub = forward(operation).subscribe({
      next: (result) => {
        assertNoConfidence((result as { data?: unknown } | null | undefined)?.data, 'result.data');
        observer.next(result);
      },
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });

    return () => sub.unsubscribe();
  });
});

// Create Apollo Client (lazy initialization to avoid SSR issues)
let _apolloClient: ApolloClient | null = null;

// Export for testing SSR guard
export function createApolloClient(): ApolloClient {
  // This should only be called on client side
  // The provider's useMemo ensures window is defined before calling this
  /* c8 ignore next 2 */
  if (typeof window === 'undefined') {
    throw new Error('Apollo Client can only be created on the client side');
  } // Cannot be tested in JSDOM environment (window is always defined)

  // Create full client with auth/error links
  return new ApolloClient({
    link: from([errorLink, noConfidenceLink, authLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        /* istanbul ignore next */
        // Define type policies for better cache management
      }, // Empty object, no logic to test
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        // Explicit default (Apollo default) to avoid implicit correctness assumptions.
        fetchPolicy: 'cache-first',
      },
      query: {
        errorPolicy: 'all',
        // Explicit default (Apollo default) to avoid implicit correctness assumptions.
        fetchPolicy: 'cache-first',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

// Export singleton Apollo Client instance (created on first access, lazy initialization)
export function getApolloClient(): ApolloClient {
  if (!_apolloClient) {
    _apolloClient = createApolloClient();
  }
  return _apolloClient;
}
