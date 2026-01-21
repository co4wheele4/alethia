import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IngestDocumentsDialog } from '../components/IngestDocumentsDialog';
import { useIngestDocuments } from '../hooks/useIngestDocuments';
import { parseFileToText } from '../ingestion/fileParsers';
import { importUrlToText } from '../ingestion/urlImport';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../hooks/useIngestDocuments');
vi.mock('../ingestion/fileParsers');
vi.mock('../ingestion/urlImport');

const mockUseIngestDocuments = useIngestDocuments as unknown as ReturnType<typeof vi.fn>;
const mockParseFileToText = parseFileToText as unknown as ReturnType<typeof vi.fn>;
const mockImportUrlToText = importUrlToText as unknown as ReturnType<typeof vi.fn>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('IngestDocumentsDialog', () => {
  const mockIngestOne = vi.fn();
  const mockReset = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnIngested = vi.fn();

  beforeAll(() => {
    // Ensure global crypto is mocked for sha256HexOfFile
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
      configurable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'idle' },
      ingestOne: mockIngestOne,
      reset: mockReset,
    });
  });

  it('renders correctly and handles manual ingestion', async () => {
    mockIngestOne.mockResolvedValue({ documentId: 'd1' });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Ingest documents')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Title$/i);
    const textInput = screen.getByLabelText(/Text$/i);
    const checkbox = screen.getByLabelText(/I understand ingestion is irreversible/i);
    const submitBtn = screen.getByRole('button', { name: /^Ingest$/i });

    fireEvent.change(titleInput, { target: { value: 'Manual Doc' } });
    fireEvent.change(textInput, { target: { value: 'Manual content' } });
    fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockIngestOne).toHaveBeenCalledWith({
      title: 'Manual Doc',
      source: { kind: 'manual' },
      text: 'Manual content',
    });
    expect(mockOnIngested).toHaveBeenCalledWith('d1');
  });

  it('handles tab switching', () => {
    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    expect(screen.getByText(/Drag & drop files here/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/URL import/i));
    expect(screen.getByLabelText(/URL$/i)).toBeInTheDocument();
  });

  it('handles file ingestion', async () => {
    mockParseFileToText.mockResolvedValue({ title: 'Parsed File', text: 'Parsed content' });
    mockIngestOne.mockResolvedValue({ documentId: 'd2' });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    // Polyfill arrayBuffer for jsdom if missing
    if (!file.arrayBuffer) {
      file.arrayBuffer = async () => new ArrayBuffer(5);
    }
    
    const dropzone = screen.getByText(/Drag & drop files here/i);
    
    // Simulate drop
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => expect(screen.getByText('test.txt')).toBeInTheDocument());

    const checkbox = screen.getByLabelText(/I understand ingestion is irreversible/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Ingest files/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockParseFileToText).toHaveBeenCalledWith(file);
    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Parsed File',
      text: 'Parsed content',
      source: expect.objectContaining({
        fileSha256: expect.any(String),
      }),
    }));
    expect(mockOnIngested).toHaveBeenCalledWith('d2');
  });

  it('handles URL ingestion', async () => {
    mockImportUrlToText.mockResolvedValue({ 
      title: 'Imported Title', 
      text: 'Imported content',
      fetchedUrl: 'https://example.com/page',
      contentType: 'text/html'
    });
    mockIngestOne.mockResolvedValue({ documentId: 'd3' });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/URL import/i));

    const urlInput = screen.getByLabelText(/URL$/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    const checkbox = screen.getByLabelText(/I understand ingestion is irreversible/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Import & ingest/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockImportUrlToText).toHaveBeenCalledWith('https://example.com');
    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Imported Title',
      text: 'Imported content',
    }));
    expect(mockOnIngested).toHaveBeenCalledWith('d3');
  });

  it('handles file ingestion failure', async () => {
    mockParseFileToText.mockResolvedValue({ title: 'Fail', text: 'Fail' });
    mockIngestOne.mockResolvedValue(null); // Simulate failure

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    if (!file.arrayBuffer) {
      file.arrayBuffer = async () => new ArrayBuffer(5);
    }
    fireEvent.drop(screen.getByText(/Drag & drop files here/i), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(screen.getByText(/Ingestion failed/i)).toBeInTheDocument();
  });

  it('handles file parsing error', async () => {
    mockParseFileToText.mockRejectedValue(new Error('Parse error'));

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    fireEvent.drop(screen.getByText(/Drag & drop files here/i), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(screen.getByText(/Parse error/i)).toBeInTheDocument();

    // Click the Alert's close button (icon button)
    fireEvent.click(screen.getByLabelText(/^Close$/i));
    expect(screen.queryByText(/Parse error/i)).not.toBeInTheDocument();
  });

  it('handles URL import error', async () => {
    mockImportUrlToText.mockRejectedValue(new Error('Import failed'));

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/URL import/i));
    fireEvent.change(screen.getByLabelText(/URL$/i), { target: { value: 'https://fail.com' } });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Import & ingest/i }));
    });

    expect(screen.getByText(/Import failed/i)).toBeInTheDocument();

    // Click the Alert's close button (icon button)
    fireEvent.click(screen.getByLabelText(/^Close$/i));
    expect(screen.queryByText(/Import failed/i)).not.toBeInTheDocument();
  });

  it('handles clearing files and opening ingested doc', async () => {
    mockParseFileToText.mockResolvedValue({ title: 'File 1', text: 'Content 1' });
    mockIngestOne.mockResolvedValue({ documentId: 'd-file-1' });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    if (!file.arrayBuffer) {
      file.arrayBuffer = async () => new ArrayBuffer(5);
    }
    fireEvent.drop(screen.getByText(/Drag & drop files here/i), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();

    // Re-add and ingest
    fireEvent.drop(screen.getByText(/Drag & drop files here/i), {
      dataTransfer: { files: [file], types: ['Files'] },
    });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    const openBtn = screen.getByRole('button', { name: /Open/i });
    fireEvent.click(openBtn);
    expect(mockOnIngested).toHaveBeenCalledWith('d-file-1');
  });

  it('handles closing the dialog', () => {
    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });

  it('handles overallBusy state during close', () => {
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'running' },
      ingestOne: mockIngestOne,
      reset: mockReset,
    });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId="u1"
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    // Close button should be disabled
    const closeBtn = screen.getByRole('button', { name: /^Close$/i });
    expect(closeBtn).toBeDisabled();
  });

  it('verifies onDialogClose does nothing when overallBusy is true', () => {
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'running' }, // makes overallBusy true
      ingestOne: mockIngestOne,
      reset: mockReset,
    });

    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={mockOnClose} userId="u1" onIngested={mockOnIngested} />
      </TestWrapper>
    );

    // Escape key or backdrop click would normally trigger onClose
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('renders info when not logged in', () => {
    mockUseIngestDocuments.mockReturnValue({
      canIngest: false,
      progress: { state: 'idle' },
      ingestOne: mockIngestOne,
      reset: mockReset,
    });

    render(
      <TestWrapper>
        <IngestDocumentsDialog
          open={true}
          onClose={mockOnClose}
          userId={null}
          onIngested={mockOnIngested}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/You must be logged in to ingest documents/i)).toBeInTheDocument();
  });

  it('handles URL ingestion with title override and fallback', async () => {
    mockImportUrlToText.mockResolvedValue({
      text: 'Imported content',
      title: '', // No title from import
      fetchedUrl: 'https://example.com',
    });

    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/URL import/i));
    fireEvent.change(screen.getByLabelText(/URL$/i), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Import & ingest/i }));
    });

    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      title: 'https://example.com', // Falls back to URL
    }));
  });

  it('handles URL ingestion failure (no documentId)', async () => {
    mockIngestOne.mockResolvedValue(null);
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/URL import/i));
    fireEvent.change(screen.getByLabelText(/URL$/i), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Import & ingest/i }));
    });

    // Should not clear input
    expect(screen.getByLabelText(/URL$/i)).toHaveValue('https://example.com');
  });

  it('handles URL import error with non-Error object', async () => {
    mockImportUrlToText.mockRejectedValue('String error');
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/URL import/i));
    fireEvent.change(screen.getByLabelText(/URL$/i), { target: { value: 'https://bad.com' } });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Import & ingest/i }));
    });

    expect(screen.getByText(/URL import failed./i)).toBeInTheDocument();
  });

  it('handles file ingestion error with non-Error object', async () => {
    mockParseFileToText.mockRejectedValue('File error');
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    fireEvent.drop(screen.getByText(/Drag & drop files here/i), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(screen.getByText(/File ingestion failed./i)).toBeInTheDocument();
  });

  it('handles manual ingestion failure (no documentId)', async () => {
    mockIngestOne.mockResolvedValue(null);
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Manual Fail' } });
    fireEvent.change(screen.getByLabelText(/Text/i), { target: { value: 'Content' } });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest/i }));
    });

    // Inputs should NOT be cleared if it failed
    expect(screen.getByLabelText(/Title/i)).toHaveValue('Manual Fail');
  });

  it('handles file ingestion with missing mime type and null hash', async () => {
    mockParseFileToText.mockResolvedValue({ title: 'Parsed File', text: 'Parsed content' });
    mockIngestOne.mockResolvedValue({ documentId: 'd-null-hash' });

    const file = new File(['hello'], 'test.txt', { type: '' }); // Empty type
    // Mock arrayBuffer to fail, causing sha256HexOfFile to return null via catch
    file.arrayBuffer = vi.fn().mockRejectedValue(new Error('fail for null hash'));
    
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    const dropzone = screen.getByLabelText('file-dropzone');
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));

    fireEvent.drop(dropzone, { dataTransfer: { files: [file], types: ['Files'] } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      source: expect.objectContaining({
        mimeType: 'application/octet-stream',
        fileSha256: undefined,
      }),
    }));
  });

  it('handles missing crypto.subtle in sha256HexOfFile', async () => {
    const originalSubtle = globalThis.crypto.subtle;
    delete (globalThis.crypto as { subtle?: unknown }).subtle;

    mockParseFileToText.mockResolvedValue({ title: 'Parsed File', text: 'Parsed content' });
    mockIngestOne.mockResolvedValue({ documentId: 'd-no-subtle' });

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    if (!file.arrayBuffer) {
      file.arrayBuffer = async () => new ArrayBuffer(5);
    }
    
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.drop(screen.getByLabelText('file-dropzone'), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      source: expect.objectContaining({
        fileSha256: undefined,
      }),
    }));

    // Restore
    Object.defineProperty(globalThis.crypto, 'subtle', { value: originalSubtle, configurable: true });
  });

  it('handles addFiles with empty list', () => {
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText(/File upload/i));
    
    // Trigger onChange of the hidden input with empty files
    const input = screen.getByLabelText('file-dropzone').querySelector('input')!;
    fireEvent.change(input, { target: { files: [] } });
    
    expect(screen.queryByText(/Queued files/i)).not.toBeInTheDocument();
  });

  it('covers tabKeyOf manual fallback', () => {
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );
    
    // Switch to file then back to manual via click (index 0)
    fireEvent.click(screen.getByText(/File upload/i));
    fireEvent.click(screen.getByText(/Manual text \(default\)/i));
    
    expect(screen.getByLabelText(/Title$/i)).toBeInTheDocument();
  });

  it('handles sha256HexOfFile rejection', async () => {
    vi.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValue(new Error('Hash fail'));

    mockParseFileToText.mockResolvedValue({ title: 'Parsed File', text: 'Parsed content' });
    mockIngestOne.mockResolvedValue({ documentId: 'd-hash-fail' });

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    if (!file.arrayBuffer) {
      file.arrayBuffer = async () => new ArrayBuffer(5);
    }
    
    render(
      <TestWrapper>
        <IngestDocumentsDialog open={true} onClose={vi.fn()} userId="u1" onIngested={vi.fn()} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/File upload/i));
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.drop(screen.getByLabelText('file-dropzone'), {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ingest files/i }));
    });

    expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
      source: expect.objectContaining({
        fileSha256: undefined,
      }),
    }));
  });
});
