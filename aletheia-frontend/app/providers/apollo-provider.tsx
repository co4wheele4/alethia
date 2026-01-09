/**
 * Apollo Provider for Next.js App Router
 * This is a client component that wraps the app with Apollo Client
 */

'use client';

import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../services/apollo-client';

export function ApolloClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
