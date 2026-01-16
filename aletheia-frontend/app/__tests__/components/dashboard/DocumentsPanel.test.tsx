/**
 * Tests for DocumentsPanel
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { DocumentsPanel } from '../../../components/dashboard/DocumentsPanel';

function createMockClient(documents: Array<{ id: string; title: string; createdAt: string }> = []) {
  const link = new ApolloLink((operation) => {
    return new Observable((observer) => {
      try {
        const opName = operation.operationName;

        if (opName === 'DocumentsByUser') {
          observer.next({ data: { documentsByUser: documents } });
          observer.complete();
          return;
        }

        observer.next({ data: null });
        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    });
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}

describe('DocumentsPanel', () => {
  it('should render info message when userId is null', () => {
    const client = createMockClient([
      { id: 'doc-1', title: 'First doc', createdAt: new Date('2026-01-01T00:00:00Z').toISOString() },
    ]);
    render(
      <ApolloProvider client={client}>
        <DocumentsPanel userId={null} />
      </ApolloProvider>
    );

    expect(screen.getByRole('heading', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByText(/unable to determine user id/i)).toBeInTheDocument();
  });

  it('should list recent documents and provide ingestion entrypoints', async () => {
    const client = createMockClient([
      { id: 'doc-1', title: 'First doc', createdAt: new Date('2026-01-01T00:00:00Z').toISOString() },
    ]);
    render(
      <ApolloProvider client={client}>
        <DocumentsPanel userId="user-1" />
      </ApolloProvider>
    );

    // Initial list
    await waitFor(() => {
      expect(screen.getByText('First doc')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /add sources/i })).toHaveAttribute('href', '/documents?ingest=1');
    expect(screen.getByRole('link', { name: /open library/i })).toHaveAttribute('href', '/documents');
  });

  it('should show empty-state message when user has no documents', async () => {
    const client = createMockClient([]);
    render(
      <ApolloProvider client={client}>
        <DocumentsPanel userId="user-1" />
      </ApolloProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no documents yet\. add a source/i),
      ).toBeInTheDocument();
    });
  });
});

