import { renderHook, act } from '@testing-library/react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { useExtraction } from '../../../features/extraction/hooks/useExtraction';

function createMockClient(opName: string, responseData: object) {
  const link = new ApolloLink((operation) => {
    return new Observable((observer) => {
      if (operation.operationName === opName) {
        observer.next({ data: responseData });
      } else if (operation.operationName === 'ChunksByDocument') {
        observer.next({ data: { chunks: [] } });
      } else {
        observer.next({ data: {} });
      }
      observer.complete();
    });
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}

describe('useExtraction', () => {
  it('handles proposeExtraction', async () => {
    const client = createMockClient('ProposeExtraction', { proposeExtraction: [] });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useExtraction(), { wrapper });

    await act(async () => {
      await result.current.proposeExtraction('c1');
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles acceptSuggestion', async () => {
    const client = createMockClient('AcceptSuggestion', { acceptSuggestion: { __typename: 'AiExtractionSuggestion', id: 's1', status: 'ACCEPTED' } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useExtraction(), { wrapper });

    await act(async () => {
      await result.current.acceptSuggestion('s1');
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles rejectSuggestion', async () => {
    const client = createMockClient('RejectSuggestion', { rejectSuggestion: { __typename: 'AiExtractionSuggestion', id: 's1', status: 'REJECTED' } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useExtraction(), { wrapper });

    await act(async () => {
      await result.current.rejectSuggestion('s1');
    });
    expect(result.current.loading).toBe(false);
  });
});
