import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentsListPane } from '../components/DocumentsListPane';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockDocuments = [
  {
    id: 'd1',
    title: 'Doc 1',
    dateAddedIso: '2023-01-01T12:00:00Z',
    sourceType: 'URL',
    sourceLabel: 'example.com',
    chunkCount: 2,
    mentionCount: 5,
    entityCount: 3,
  },
  {
    id: 'd2',
    title: 'Doc 2',
    dateAddedIso: '2023-01-02T12:00:00Z',
    sourceType: null,
    sourceLabel: null,
    chunkCount: 0,
    mentionCount: 0,
    entityCount: 0,
  },
  {
    id: 'd3',
    title: 'Doc 3',
    dateAddedIso: '2023-01-03T12:00:00Z',
    sourceType: 'MANUAL',
    sourceLabel: null,
    chunkCount: 1,
    mentionCount: 0,
    entityCount: 0,
  },
];

describe('DocumentsListPane', () => {
  it('renders a list of documents with provenance + counts', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TestWrapper>
        <DocumentsListPane
          documents={mockDocuments as any}
          allDocumentsCount={3}
          filter=""
          onFilterChange={vi.fn()}
          selectedId="d1"
          onSelect={onSelect}
          loading={false}
          busy={false}
          onDelete={onDelete}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(screen.getByText('Doc 2')).toBeInTheDocument();
    expect(screen.getByText('Doc 3')).toBeInTheDocument();

    // Provenance summary is explicit; missing values are shown as "(missing)"
    expect(screen.getByText(/Source type:\s*URL/i)).toBeInTheDocument();
    expect(screen.getByText(/Source type:\s*\(missing\)/i)).toBeInTheDocument();

    // Counts are inspectable, not "status" guesses
    expect(screen.getByText(/Chunks:\s*2\s*•\s*Mentions:\s*5\s*•\s*Entities:\s*3/i)).toBeInTheDocument();
    expect(screen.getByText(/Chunks:\s*0\s*•\s*Mentions:\s*0\s*•\s*Entities:\s*0/i)).toBeInTheDocument();
  });

  it('handles document selection', () => {
    const onSelect = vi.fn();
    render(
      <TestWrapper>
        <DocumentsListPane
          documents={mockDocuments as any}
          allDocumentsCount={3}
          filter=""
          onFilterChange={vi.fn()}
          selectedId="d1"
          onSelect={onSelect}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Doc 2'));
    expect(onSelect).toHaveBeenCalledWith('d2');
  });

  it('handles document deletion', () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <DocumentsListPane
          documents={mockDocuments as any}
          allDocumentsCount={3}
          filter=""
          onFilterChange={vi.fn()}
          selectedId="d1"
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={onDelete}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    const deleteBtn = screen.getByLabelText(/Delete Doc 1/i);
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('d1');
  });

  it('handles filter change', () => {
    const onFilterChange = vi.fn();
    render(
      <TestWrapper>
        <DocumentsListPane
          documents={mockDocuments as any}
          allDocumentsCount={3}
          filter=""
          onFilterChange={onFilterChange}
          selectedId="d1"
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    const filterInput = screen.getByLabelText(/Filter/i);
    fireEvent.change(filterInput, { target: { value: 'search' } });
    expect(onFilterChange).toHaveBeenCalledWith('search');
  });

  it('renders loading state', () => {
    render(
      <TestWrapper>
        <DocumentsListPane
          documents={[]}
          allDocumentsCount={0}
          filter=""
          onFilterChange={vi.fn()}
          selectedId={null}
          onSelect={vi.fn()}
          loading={true}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Fetching document index/i)).toBeInTheDocument();
  });

  it('renders empty states', () => {
    const { rerender } = render(
      <TestWrapper>
        <DocumentsListPane
          documents={[]}
          allDocumentsCount={0}
          filter=""
          onFilterChange={vi.fn()}
          selectedId={null}
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No documents yet/i)).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <DocumentsListPane
          documents={[]}
          allDocumentsCount={3}
          filter="xyz"
          onFilterChange={vi.fn()}
          selectedId={null}
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No documents match your filter/i)).toBeInTheDocument();
  });

  it('handles load more button', () => {
    const manyDocs = Array.from({ length: 30 }, (_, i) => ({
      id: `d${i}`,
      title: `Doc ${i}`,
      dateAddedIso: '2023-01-01T12:00:00Z',
      chunkCount: 1,
      mentionCount: 0,
      entityCount: 0,
    }));

    render(
      <TestWrapper>
        <DocumentsListPane
          documents={manyDocs as any}
          allDocumentsCount={30}
          filter=""
          onFilterChange={vi.fn()}
          selectedId={null}
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Doc 0')).toBeInTheDocument();
    expect(screen.queryByText('Doc 25')).not.toBeInTheDocument();

    const loadMoreBtn = screen.getByText(/Load more/i);
    fireEvent.click(loadMoreBtn);

    expect(screen.getByText('Doc 25')).toBeInTheDocument();
  });

  it('handles onOpenIngest', () => {
    const onOpenIngest = vi.fn();
    render(
      <TestWrapper>
        <DocumentsListPane
          documents={[]}
          allDocumentsCount={0}
          filter=""
          onFilterChange={vi.fn()}
          selectedId={null}
          onSelect={vi.fn()}
          loading={false}
          busy={false}
          onDelete={vi.fn()}
          onOpenIngest={onOpenIngest}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('open-ingest-dialog'));
    expect(onOpenIngest).toHaveBeenCalled();
  });
});
