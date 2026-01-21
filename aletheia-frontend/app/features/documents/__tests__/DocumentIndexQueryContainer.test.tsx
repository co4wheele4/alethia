import { render, screen } from '@testing-library/react';
import { DocumentIndexQueryContainer } from '../components/DocumentIndexQueryContainer';
import { useDocumentIndex } from '../hooks/useDocumentIndex';
import { vi } from 'vitest';

vi.mock('../hooks/useDocumentIndex');

describe('DocumentIndexQueryContainer', () => {
  it('passes data from hook to children', () => {
    const mockRefetch = vi.fn();
    (useDocumentIndex as any).mockReturnValue({
      documents: [{ id: 'd1', title: 'Doc 1' }],
      loading: false,
      error: null,
      refetch: mockRefetch
    });

    const children = vi.fn(({ documents }: any) => <div>{documents[0].title}</div>);

    render(
      <DocumentIndexQueryContainer userId="u1">
        {children}
      </DocumentIndexQueryContainer>
    );

    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    
    // Check that children was called with expected data
    const callArgs = children.mock.calls[0][0];
    expect(callArgs.documents).toEqual([{ id: 'd1', title: 'Doc 1' }]);
    expect(callArgs.loading).toBe(false);
    expect(callArgs.error).toBe(null);
    expect(typeof callArgs.refetch).toBe('function');

    // Test refetch call
    callArgs.refetch();
    expect(mockRefetch).toHaveBeenCalled();
  });
});
