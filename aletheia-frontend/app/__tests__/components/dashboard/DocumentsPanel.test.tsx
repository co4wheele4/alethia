/**
 * Tests for DocumentsPanel
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { DocumentsPanel } from '../../../components/dashboard/DocumentsPanel';

/* eslint-disable @typescript-eslint/no-explicit-any */
function createMockClient() {
  let documents = [
    { id: 'doc-1', title: 'First doc', createdAt: new Date('2026-01-01T00:00:00Z').toISOString() },
  ];

  const link = new ApolloLink((operation) => {
    return new Observable((observer) => {
      try {
        const opName = operation.operationName;

        if (opName === 'DocumentsByUser') {
          observer.next({ data: { documentsByUser: documents } });
          observer.complete();
          return;
        }

        if (opName === 'CreateDocument') {
          const title = operation.variables?.title as string;
          const newDoc = {
            id: `doc-${documents.length + 1}`,
            title,
            createdAt: new Date('2026-01-02T00:00:00Z').toISOString(),
          };
          documents = [...documents, newDoc];
          observer.next({ data: { createDocument: newDoc } });
          observer.complete();
          return;
        }

        if (opName === 'DeleteDocument') {
          const id = operation.variables?.id as string;
          documents = documents.filter((d) => d.id !== id);
          observer.next({ data: { deleteDocument: { id } } });
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
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('DocumentsPanel', () => {
  it('should render info message when userId is null', () => {
    const client = createMockClient();
    render(
      <ApolloProvider client={client}>
        <DocumentsPanel userId={null} />
      </ApolloProvider>
    );

    expect(screen.getByRole('heading', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByText(/unable to determine user id/i)).toBeInTheDocument();
  });

  it('should list documents, add a new one, and delete it', async () => {
    const client = createMockClient();
    render(
      <ApolloProvider client={client}>
        <DocumentsPanel userId="user-1" />
      </ApolloProvider>
    );

    // Initial list
    await waitFor(() => {
      expect(screen.getByText('First doc')).toBeInTheDocument();
    });

    // Add
    fireEvent.change(screen.getByTestId('document-title-input'), {
      target: { value: 'Second doc' },
    });
    fireEvent.click(screen.getByTestId('add-document-button'));

    await waitFor(() => {
      expect(screen.getByText('Second doc')).toBeInTheDocument();
    });

    // Delete
    fireEvent.click(screen.getByTestId('delete-document-doc-2'));

    await waitFor(() => {
      expect(screen.queryByText('Second doc')).not.toBeInTheDocument();
    });
  });
});

