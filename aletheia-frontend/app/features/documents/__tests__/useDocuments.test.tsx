import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocuments, useDocumentsInternal } from '../hooks/useDocuments';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  DOCUMENTS_BY_USER_QUERY,
  CREATE_DOCUMENT_MUTATION,
  DELETE_DOCUMENT_MUTATION,
} from '../graphql';

const mockDoc1 = { id: 'd1', title: 'Doc 1', createdAt: '2023-01-01T00:00:00Z', __typename: 'Document' };
const mockDoc2 = { id: 'd2', title: 'New Doc', createdAt: '2023-01-02T00:00:00Z', __typename: 'Document' };

const mocks = [
  {
    request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
    result: { data: { documentsByUser: [mockDoc1] } },
  },
  {
    request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'New Doc' } },
    result: { data: { createDocument: mockDoc2 } },
  },
  {
    request: { query: DELETE_DOCUMENT_MUTATION, variables: { id: 'd1' } },
    result: { data: { deleteDocument: { id: 'd1', __typename: 'Document' } } },
  },
  {
    request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
    result: { data: { documentsByUser: [mockDoc1, mockDoc2] } },
  },
  {
    request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
    result: { data: { documentsByUser: [mockDoc2] } },
  },
];

describe('useDocuments', () => {
  it('should fetch documents', async () => {
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].title).toBe('Doc 1');
  });

  it('should call create mutation', async () => {
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let newDoc: { title: string } | null | undefined;
    await act(async () => {
      newDoc = await result.current.createDocument('New Doc');
    });

    expect(newDoc).toBeDefined();
    expect(newDoc?.title).toBe('New Doc');
  });

  it('should call delete mutation', async () => {
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let deletedId;
    await act(async () => {
      deletedId = await result.current.deleteDocument('d1');
    });

    expect(deletedId).toBe('d1');
  });

  it('useDocumentsInternal with skipList', () => {
    const { result } = renderHook(() => useDocumentsInternal('u1', { skipList: true }), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.documents).toEqual([]);
  });

  it('createDocument should not crash if userId is null', async () => {
    const { result } = renderHook(() => useDocuments(null), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]}>
          {children}
        </MockedProvider>
      ),
    });

    const res = await result.current.createDocument('title');
    expect(res).toBeUndefined();
  });

  it('deleteDocument should not crash if userId is null', async () => {
    const { result } = renderHook(() => useDocuments(null), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={[]}>
          {children}
        </MockedProvider>
      ),
    });

    const res = await result.current.deleteDocument('id');
    expect(res).toBeUndefined();
  });

  it('should handle missing data in createDocument update', async () => {
    const emptyMock = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Empty' } },
        result: { data: { createDocument: null } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={emptyMock}>
          {children}
        </MockedProvider>
      ),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.createDocument('Empty'); });
  });

  it('should handle missing id in deleteDocument update', async () => {
    const emptyMock = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [mockDoc1] } },
      },
      {
        request: { query: DELETE_DOCUMENT_MUTATION, variables: { id: 'd1' } },
        result: { data: { deleteDocument: { __typename: 'Document' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      }
    ];
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={emptyMock}>
          {children}
        </MockedProvider>
      ),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteDocument('d1'); });
  });

  it('should handle already existing doc in upsert', async () => {
    const existingMock = [
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [mockDoc1] } },
      },
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'Doc 1' } },
        result: { data: { createDocument: mockDoc1 } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [mockDoc1] } },
      },
    ];
    const { result } = renderHook(() => useDocuments('u1'), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={existingMock}>
          {children}
        </MockedProvider>
      ),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.createDocument('Doc 1'); });
    expect(result.current.documents).toHaveLength(1);
  });

  it('should handle missing existing data in upsert', async () => {
    const mockNoTypename = { id: 'd1', title: 'No Typename', createdAt: '2023-01-01T00:00:00Z' };
    const mockData = [
      {
        request: { query: CREATE_DOCUMENT_MUTATION, variables: { userId: 'u1', title: 'New' } },
        result: { data: { createDocument: mockNoTypename } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [{ ...mockNoTypename, __typename: 'Document' }] } },
      },
    ];
    const { result } = renderHook(() => useDocumentsInternal('u1', { skipList: true }), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mockData}>
          {children}
        </MockedProvider>
      ),
    });
    
    await act(async () => { await result.current.createDocument('New'); });
  });

  it('should handle missing existing data in remove', async () => {
    const mockData = [
      {
        request: { query: DELETE_DOCUMENT_MUTATION, variables: { id: 'd1' } },
        result: { data: { deleteDocument: { id: 'd1', __typename: 'Document' } } },
      },
      {
        request: { query: DOCUMENTS_BY_USER_QUERY, variables: { userId: 'u1' } },
        result: { data: { documentsByUser: [] } },
      },
    ];
    const { result } = renderHook(() => useDocumentsInternal('u1', { skipList: true }), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mockData}>
          {children}
        </MockedProvider>
      ),
    });
    
    await act(async () => { await result.current.deleteDocument('d1'); });
  });
});
