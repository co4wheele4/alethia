import { render, screen, fireEvent, act } from '@testing-library/react';
import { DocumentsDashboard } from '../components/DocumentsDashboard';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

const mockRefetch = vi.fn().mockResolvedValue({});
const mockDeleteDocument = vi.fn().mockResolvedValue({});

// Mutable mock state to allow per-test overrides
const mockState = {
  indexDocuments: [
    { id: 'd1', title: 'Doc 1' },
    { id: 'd2', title: 'Doc 2' },
    { id: 'd3', title: 'Doc 3' }
  ],
  indexLoading: false,
  indexError: null as any,
  deleteBusy: false,
  deleteError: null as any,
  docHeader: { id: 'd1', title: 'Doc 1' } as any,
  docLoading: false,
  docError: null as any,
  chunks: [] as any[],
  chunksLoading: false,
  chunksError: null as any,
};

vi.mock('../components/DocumentsListPane', () => ({
  DocumentsListPane: (props: any) => (
    <div data-testid="list-pane">
      List Pane
      <button onClick={() => props.onFilterChange('search')}>Filter</button>
      <button onClick={() => props.onSelect('d2')}>Select D2</button>
      <button onClick={() => props.onDelete('d1')}>Delete D1</button>
      <button onClick={() => props.onOpenIngest()}>Open Ingest</button>
      {props.documents.map((d: any) => <div key={d.id}>{d.title}</div>)}
    </div>
  ),
}));

vi.mock('../components/DocumentDetailsPane', () => ({
  DocumentDetailsPane: (props: any) => (
    <div data-testid="details-pane">
      Details Pane: {String(props.selectedId ?? 'None')}
      {typeof props.initialChunkIndex === 'number' ? ` • chunk=${props.initialChunkIndex}` : ''}
      {props.deepLinkMentionId ? ` • mention=${props.deepLinkMentionId}` : ''}
    </div>
  ),
}));

vi.mock('../components/IngestDocumentsDialog', () => ({
  IngestDocumentsDialog: (props: any) => (
    props.open ? (
      <div data-testid="ingest-dialog">
        Ingest Dialog
        <button onClick={() => props.onIngested('d3')}>Ingest D3</button>
        <button onClick={() => props.onClose()}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../components/DocumentIndexQueryContainer', () => ({
  DocumentIndexQueryContainer: ({ children }: any) => {
    return children({
      documents: mockState.indexDocuments,
      loading: mockState.indexLoading,
      error: mockState.indexError,
      refetch: mockRefetch
    });
  },
}));

vi.mock('../components/DeleteDocumentMutationContainer', () => ({
  DeleteDocumentMutationContainer: ({ children }: any) =>
    children({
      deleteDocument: mockDeleteDocument,
      busy: mockState.deleteBusy,
      error: mockState.deleteError
    }),
}));

vi.mock('../components/SelectedDocumentHeaderQueryContainer', () => ({
  SelectedDocumentHeaderQueryContainer: ({ children, documentId }: any) => {
    let doc = null;
    if (documentId) {
        doc = mockState.indexDocuments.find(d => d.id === documentId) || null;
    }
    return children({
      document: doc,
      loading: mockState.docLoading,
      error: mockState.docError
    });
  },
}));

vi.mock('../components/SelectedDocumentChunksQueryContainer', () => ({
  SelectedDocumentChunksQueryContainer: ({ children }: any) =>
    children({
      chunks: mockState.chunks,
      loading: mockState.chunksLoading,
      error: mockState.chunksError
    }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('DocumentsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.indexDocuments = [
        { id: 'd1', title: 'Doc 1' },
        { id: 'd2', title: 'Doc 2' },
        { id: 'd3', title: 'Doc 3' }
    ];
    mockState.indexLoading = false;
    mockState.indexError = null;
    mockState.deleteBusy = false;
    mockState.deleteError = null;
    mockState.docLoading = false;
    mockState.docError = null;
    mockState.chunks = [];
    mockState.chunksLoading = false;
    mockState.chunksError = null;
  });

  it('renders correctly and handles interactions', async () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(screen.getByText('Doc 2')).toBeInTheDocument();

    // Default selection is first doc
    expect(screen.getByTestId('details-pane')).toHaveTextContent('Details Pane: d1');

    // Handle filter
    fireEvent.click(screen.getByText('Filter'));
    // After filter 'search', nothing should match if title doesn't contain 'search'
    expect(screen.queryByText('Doc 1')).not.toBeInTheDocument();
  });

  it('handles document selection', () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Select D2'));
    expect(screen.getByTestId('details-pane')).toHaveTextContent('Details Pane: d2');
  });

  it('handles document deletion', async () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Delete D1'));
    });
    expect(mockDeleteDocument).toHaveBeenCalledWith('d1');
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles ingestion', async () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Ingest'));
    expect(screen.getByTestId('ingest-dialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Ingest D3'));
    });

    expect(screen.queryByTestId('ingest-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('details-pane')).toHaveTextContent('Details Pane: d3');
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles closing the ingest dialog', async () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Ingest'));
    expect(screen.getByTestId('ingest-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('ingest-dialog')).not.toBeInTheDocument();
  });

  it('renders info when not logged in', () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Documents are available after login/i)).toBeInTheDocument();
  });

  it('handles initial selected id and chunk index', () => {
    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" initialSelectedId="d2" initialChunkIndex={5} />
      </TestWrapper>
    );

    expect(screen.getByTestId('details-pane')).toHaveTextContent('Details Pane: d2');
  });

  it('renders index error', () => {
    mockState.indexError = { message: 'Index Error' };

    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('Index Error')).toBeInTheDocument();
  });

  it('renders delete error', () => {
    mockState.deleteError = { message: 'Delete Error' };

    render(
      <TestWrapper>
        <DocumentsDashboard userId="u1" />
      </TestWrapper>
    );

    expect(screen.getByText('Delete Error')).toBeInTheDocument();
  });
});
