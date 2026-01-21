import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentChunkNavigation } from '../components/DocumentChunkNavigation';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockChunks = [
  { id: 'c0', chunkIndex: 0, content: 'c0', mentions: [{ id: 'm1' }] },
  { id: 'c1', chunkIndex: 1, content: 'c1', mentions: [] },
  { id: 'c2', chunkIndex: 2, content: 'c2', mentions: [{ id: 'm2' }, { id: 'm3' }] },
];

describe('DocumentChunkNavigation', () => {
  it('renders chunks and handles selection', () => {
    const onSelect = vi.fn();
    render(
      <TestWrapper>
        <DocumentChunkNavigation
          chunks={mockChunks as any}
          selectedChunkIndex={0}
          onSelectChunkIndex={onSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Chunk 0')).toBeInTheDocument();
    expect(screen.getByText('1 mentions')).toBeInTheDocument();
    expect(screen.getByText('0 mentions')).toBeInTheDocument();
    expect(screen.getByText('2 mentions')).toBeInTheDocument();

    const chunk1Btn = screen.getByText('Chunk 1');
    fireEvent.click(chunk1Btn);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('handles load more chunks', () => {
    const manyChunks = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      chunkIndex: i,
      content: `Chunk ${i} content`,
      mentions: [],
    }));

    render(
      <TestWrapper>
        <DocumentChunkNavigation
          chunks={manyChunks as any}
          selectedChunkIndex={null}
          onSelectChunkIndex={vi.fn()}
        />
      </TestWrapper>
    );

    // Initially 40 chunks are visible
    expect(screen.queryByText('Chunk 39')).toBeInTheDocument();
    expect(screen.queryByText('Chunk 40')).not.toBeInTheDocument();

    const loadMoreBtn = screen.getByRole('button', { name: /Load more chunks/i });
    fireEvent.click(loadMoreBtn);

    expect(screen.getByText('Chunk 40')).toBeInTheDocument();
  });

  it('handles null mentions gracefully', () => {
    const chunksWithNullMentions = [
      { id: 'c1', chunkIndex: 0, content: 'c1', mentions: null }
    ];
    render(
      <TestWrapper>
        <DocumentChunkNavigation
          chunks={chunksWithNullMentions as any}
          selectedChunkIndex={null}
          onSelectChunkIndex={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('0 mentions')).toBeInTheDocument();
  });
});
