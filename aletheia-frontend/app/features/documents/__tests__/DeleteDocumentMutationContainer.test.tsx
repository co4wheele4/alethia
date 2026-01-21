import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { DeleteDocumentMutationContainer } from '../components/DeleteDocumentMutationContainer';
import { MockedProvider } from '@apollo/client/testing/react';
import { DELETE_DOCUMENT_MUTATION } from '../graphql';
import { useEffect } from 'react';

const mocks = [
  {
    request: {
      query: DELETE_DOCUMENT_MUTATION,
      variables: { id: 'd1' },
    },
    result: {
      data: {
        deleteDocument: { __typename: 'Document', id: 'd1' },
      },
    },
  },
];

describe('DeleteDocumentMutationContainer', () => {
  it('provides delete action and state', async () => {
    let capturedBusy = false;
    let capturedError: Error | null = null;

    const Inner = ({ busy, error, deleteDocument }: { 
      busy: boolean; 
      error: Error | null; 
      deleteDocument: (id: string) => Promise<string | null> 
    }) => {
      useEffect(() => {
        capturedBusy = busy;
      }, [busy]);
      useEffect(() => {
        capturedError = error;
      }, [error]);
      return (
        <button onClick={() => deleteDocument('d1')}>
          Delete
        </button>
      );
    };

    const TestComponent = () => (
      <DeleteDocumentMutationContainer>
        {(state) => <Inner {...state} />}
      </DeleteDocumentMutationContainer>
    );

    render(
      <MockedProvider mocks={mocks}>
        <TestComponent />
      </MockedProvider>
    );

    expect(capturedBusy).toBe(false);
    expect(capturedError).toBe(null);

    const btn = screen.getByText('Delete');
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => expect(capturedBusy).toBe(false));
  });

  it('handles mutation error', async () => {
    const errorMocks = [
      {
        request: {
          query: DELETE_DOCUMENT_MUTATION,
          variables: { id: 'd1' },
        },
        result: {
          errors: [new Error('Mutation failed')],
        },
      },
    ];

    let capturedError: any = null;

    const Inner = ({ error, deleteDocument }: { 
      error: any; 
      deleteDocument: (id: string) => Promise<string | null> 
    }) => {
      useEffect(() => {
        capturedError = error;
      }, [error]);
      return (
        <button onClick={() => deleteDocument('d1')}>
          Delete
        </button>
      );
    };

    const TestComponent = () => (
      <DeleteDocumentMutationContainer>
        {(state) => <Inner {...state} />}
      </DeleteDocumentMutationContainer>
    );

    render(
      <MockedProvider mocks={errorMocks}>
        <TestComponent />
      </MockedProvider>
    );

    const btn = screen.getByText('Delete');
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => expect(capturedError).not.toBe(null));
    expect(String(capturedError?.message ?? '')).toContain('Mutation failed');
  });

  it('handles null response from mutation', async () => {
    const nullMocks = [
      {
        request: {
          query: DELETE_DOCUMENT_MUTATION,
          variables: { id: 'd1' },
        },
        result: {
          data: {
            deleteDocument: null,
          },
        },
      },
    ];

    let capturedResult: string | null = 'not-null';

    const TestComponent = () => (
      <DeleteDocumentMutationContainer>
        {({ deleteDocument }) => (
          <button onClick={async () => {
            capturedResult = await deleteDocument('d1');
          }}>
            Delete
          </button>
        )}
      </DeleteDocumentMutationContainer>
    );

    render(
      <MockedProvider mocks={nullMocks}>
        <TestComponent />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(capturedResult).toBe(null));
  });
});
