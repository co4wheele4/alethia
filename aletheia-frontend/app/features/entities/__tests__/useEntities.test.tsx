import { renderHook, waitFor } from '@testing-library/react';
import { useEntities } from '../hooks/useEntities';
import { MockedProvider } from '@apollo/client/testing/react';
import { ENTITIES_QUERY } from '../graphql';

const mocks = [
  {
    request: {
      query: ENTITIES_QUERY,
    },
    result: {
      data: {
        entities: [
          { id: 'e1', name: 'Entity One', type: 'Person', mentionCount: 5, __typename: 'Entity' },
        ],
      },
    },
  },
];

describe('useEntities hook', () => {
  it('should fetch entities', async () => {
    const { result } = renderHook(() => useEntities(), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.entities).toHaveLength(1);
    });
    expect(result.current.entities[0].name).toBe('Entity One');
  });
});
