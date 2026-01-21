import { render, screen } from '@testing-library/react';
import { SelectedDocumentHeaderQueryContainer } from '../components/SelectedDocumentHeaderQueryContainer';
import { useDocumentHeader } from '../hooks/useDocumentChunks';
import { vi } from 'vitest';

vi.mock('../hooks/useDocumentChunks');

describe('SelectedDocumentHeaderQueryContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes data from hook to children', () => {
    (useDocumentHeader as any).mockReturnValue({
      document: { id: 'd1', title: 'Doc 1' },
      loading: false,
      error: null
    });

    const children = vi.fn(({ document }: any) => <div>{document?.title}</div>);

    render(
      <SelectedDocumentHeaderQueryContainer documentId="d1">
        {children}
      </SelectedDocumentHeaderQueryContainer>
    );

    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(children).toHaveBeenCalledWith(expect.objectContaining({
      document: { id: 'd1', title: 'Doc 1' },
      loading: false,
      error: null
    }));
  });

  it('handles null documentId', () => {
    (useDocumentHeader as any).mockReturnValue({
        document: null,
        loading: false,
        error: null
    });

    const children = vi.fn(() => <div>Null</div>);

    render(
      <SelectedDocumentHeaderQueryContainer documentId={null}>
        {children}
      </SelectedDocumentHeaderQueryContainer>
    );

    expect(children).toHaveBeenCalledWith({
      document: null,
      loading: false,
      error: null
    });
  });
});
