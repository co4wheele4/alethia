import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { SuggestedExtractionsPanel } from '../../../features/extraction/components/SuggestedExtractionsPanel';

function createMockClient(responses: Record<string, object>) {
  const link = new ApolloLink((operation) => {
    return new Observable((observer) => {
      const opName = operation.operationName;
      const data = opName ? (responses[opName] || {}) : {};
      observer.next({ data });
      observer.complete();
    });
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}

import { AiExtractionSuggestionItem } from '../../../features/documents/hooks/useDocumentChunks';

const mockSuggestions: AiExtractionSuggestionItem[] = [
  {
    __typename: 'AiExtractionSuggestion',
    id: 's1',
    kind: 'ENTITY_MENTION',
    status: 'PENDING',
    entityName: 'Alice',
    entityType: 'PERSON',
    excerpt: 'Alice',
  },
  {
    __typename: 'AiExtractionSuggestion',
    id: 's2',
    kind: 'RELATIONSHIP',
    status: 'PENDING',
    subjectName: 'Alice',
    objectName: 'Bob',
    relation: 'MET',
    excerpt: 'met',
  },
];

describe('SuggestedExtractionsPanel', () => {
  it('renders pending suggestions', () => {
    const client = createMockClient({});
    render(
      <ApolloProvider client={client}>
        <SuggestedExtractionsPanel chunkId="c1" suggestions={mockSuggestions} />
      </ApolloProvider>
    );

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('MET')).toBeDefined();
  });

  it('renders empty message when no pending suggestions', () => {
    const client = createMockClient({});
    render(
      <ApolloProvider client={client}>
        <SuggestedExtractionsPanel chunkId="c1" suggestions={[]} />
      </ApolloProvider>
    );

    expect(screen.getByText(/No pending suggestions/i)).toBeDefined();
  });

  it('calls proposeExtraction when Propose button is clicked', async () => {
    const onRefresh = vi.fn();
    const client = createMockClient({
      'ProposeExtraction': { proposeExtraction: [] },
      'ChunksByDocument': { chunks: [] }
    });

    render(
      <ApolloProvider client={client}>
        <SuggestedExtractionsPanel chunkId="c1" suggestions={[]} onRefresh={onRefresh} />
      </ApolloProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Propose/i }));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('calls acceptSuggestion when Accept button is clicked', async () => {
    const onRefresh = vi.fn();
    const client = createMockClient({
      'AcceptSuggestion': { acceptSuggestion: { __typename: 'AiExtractionSuggestion', id: 's1', status: 'ACCEPTED' } },
      'ChunksByDocument': { chunks: [] }
    });

    render(
      <ApolloProvider client={client}>
        <SuggestedExtractionsPanel chunkId="c1" suggestions={[mockSuggestions[0]]} onRefresh={onRefresh} />
      </ApolloProvider>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Accept/i })[0]);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('calls rejectSuggestion when Reject button is clicked', async () => {
    const onRefresh = vi.fn();
    const client = createMockClient({
      'RejectSuggestion': { rejectSuggestion: { __typename: 'AiExtractionSuggestion', id: 's1', status: 'REJECTED' } },
      'ChunksByDocument': { chunks: [] }
    });

    render(
      <ApolloProvider client={client}>
        <SuggestedExtractionsPanel chunkId="c1" suggestions={[mockSuggestions[0]]} onRefresh={onRefresh} />
      </ApolloProvider>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Reject/i })[0]);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
