import { render, screen } from '@testing-library/react';
import { SelectedDocumentChunksQueryContainer } from '../components/SelectedDocumentChunksQueryContainer';
import { useChunksByDocument } from '../hooks/useDocumentChunks';
import { vi } from 'vitest';

vi.mock('../hooks/useDocumentChunks');

describe('SelectedDocumentChunksQueryContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes data from hook to children', () => {
    (useChunksByDocument as any).mockReturnValue({
      chunks: [{ id: 'c1', content: 'chunk 1' }],
      loading: false,
      error: null
    });

    const children = vi.fn(({ chunks }: any) => <div>{chunks[0]?.content}</div>);

    render(
      <SelectedDocumentChunksQueryContainer documentId="d1">
        {children}
      </SelectedDocumentChunksQueryContainer>
    );

    expect(screen.getByText('chunk 1')).toBeInTheDocument();
    expect(children).toHaveBeenCalledWith(expect.objectContaining({
      chunks: [{ id: 'c1', content: 'chunk 1' }],
      loading: false,
      error: null
    }));
  });

  it('handles null documentId', () => {
    (useChunksByDocument as any).mockReturnValue({
        chunks: [],
        loading: false,
        error: null
    });

    const children = vi.fn(() => <div>Null</div>);

    render(
      <SelectedDocumentChunksQueryContainer documentId={null}>
        {children}
      </SelectedDocumentChunksQueryContainer>
    );

    expect(children).toHaveBeenCalledWith({
      chunks: [],
      loading: false,
      error: null
    });
  });
});
