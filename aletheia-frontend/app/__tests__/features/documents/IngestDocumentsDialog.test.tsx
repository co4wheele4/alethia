/**
 * IngestDocumentsDialog tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';

import { IngestDocumentsDialog } from '../../../features/documents/components/IngestDocumentsDialog';

function createMockClient() {
  const calls: string[] = [];
  const link = new ApolloLink((operation) => {
    calls.push(operation.operationName ?? 'Unknown');
    return new Observable((observer) => {
      const opName = operation.operationName;

      if (opName === 'CreateDocument') {
        observer.next({
          data: {
            createDocument: {
              __typename: 'Document',
              id: 'doc-1',
              title: operation.variables?.title ?? 'Untitled',
              createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
            },
          },
        });
        observer.complete();
        return;
      }

      if (opName === 'CreateChunk') {
        observer.next({
          data: {
            createChunk: {
              __typename: 'DocumentChunk',
              id: `chunk-${operation.variables?.chunkIndex ?? 0}`,
              chunkIndex: operation.variables?.chunkIndex ?? 0,
              content: operation.variables?.content ?? '',
              documentId: operation.variables?.documentId ?? 'doc-1',
            },
          },
        });
        observer.complete();
        return;
      }

      if (opName === 'DocumentsByUser') {
        // Refetch after createDocument
        observer.next({ data: { documentsByUser: [] } });
        observer.complete();
        return;
      }

      observer.next({ data: null });
      observer.complete();
    });
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return { client, calls };
}

describe('IngestDocumentsDialog', () => {
  it('ingests manual text by creating document then chunks', async () => {
    const { client, calls } = createMockClient();
    const onIngested = vi.fn();

    render(
      <ApolloProvider client={client}>
        <IngestDocumentsDialog open onClose={() => {}} userId="user-1" onIngested={onIngested} />
      </ApolloProvider>
    );

    // Manual tab is default
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My note' } });
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello world' } });

    // Explicit irreversible-ingestion confirmation is required
    fireEvent.click(screen.getByLabelText(/i understand ingestion is irreversible/i));

    fireEvent.click(screen.getByRole('button', { name: 'Ingest' }));

    await waitFor(() => {
      expect(onIngested).toHaveBeenCalledWith('doc-1');
    });

    // Ensure mutations happen in the expected order (document before chunks).
    const createDocumentIndex = calls.indexOf('CreateDocument');
    const createChunkIndex = calls.indexOf('CreateChunk');
    expect(createDocumentIndex).toBeGreaterThanOrEqual(0);
    expect(createChunkIndex).toBeGreaterThan(createDocumentIndex);
  });
});

