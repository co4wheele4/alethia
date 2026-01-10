/**
 * Apollo Provider for Next.js App Router
 * This is a client component that wraps the app with Apollo Client
 */

'use client';

import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { useMemo } from 'react';
import { getApolloClient } from '../services/apollo-client';
import { GRAPHQL_URL } from '../lib/constants';

export function ApolloClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create client - use minimal SSR client during SSR, full client on client side
  const client = useMemo(() => {
    // During SSR, create a minimal client that won't be used
    // but allows ApolloProvider to wrap children (prevents hooks from failing)
    if (typeof window === 'undefined') {
      return new ApolloClient({
        link: createHttpLink({ uri: GRAPHQL_URL }),
        cache: new InMemoryCache(),
        ssrMode: true,
      });
    }
    
    // On client side, create full client with auth/error links
    try {
      return getApolloClient();
    } catch (error) {
      console.error('Error creating Apollo Client:', error);
      // Fallback to minimal client
      return new ApolloClient({
        link: createHttpLink({ uri: GRAPHQL_URL }),
        cache: new InMemoryCache(),
      });
    }
  }, []);

  // Always wrap with ApolloProvider so hooks can access context
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
