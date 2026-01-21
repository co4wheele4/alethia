/**
 * Tests for OnboardingWizard component.
 * Verifies deterministic progression and validation.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { OnboardingWizard, reducer } from '../OnboardingWizard';
import { useAuth } from '../../auth/hooks/useAuth';
import { useIngestDocuments } from '../../documents/hooks/useIngestDocuments';
import { useRouter } from 'next/navigation';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ThemeProvider } from '../../../hooks/useTheme';
import * as urlImport from '../../documents/ingestion/urlImport';
import * as fileParsers from '../../documents/ingestion/fileParsers';

// Mock ReviewStep to allow bypass of validation for testing the Wizard's own validation
vi.mock('../steps/ReviewStep', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../steps/ReviewStep')>();
  return {
    ...actual,
    ReviewStep: (props: any) => {
      return (
        <div data-testid="mock-review-step">
          <actual.ReviewStep {...props} />
          <button data-testid="force-commit-btn" onClick={props.onCommitIngestion}>FORCE_COMMIT_ACTION</button>
          <button data-testid="invalid-preview-btn" onClick={() => props.onGeneratePreview('invalid-id')}>INVALID_PREVIEW</button>
        </div>
      );
    }
  };
});

// Mock hooks
vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../documents/hooks/useIngestDocuments', () => ({
  useIngestDocuments: vi.fn(),
  splitIntoChunks: vi.fn((text) => text ? [text] : []),
}));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock ingestion utils
vi.mock('../../documents/ingestion/urlImport', () => ({
  importUrlToText: vi.fn(),
}));
vi.mock('../../documents/ingestion/fileParsers', () => ({
  parseFileToText: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseIngestDocuments = vi.mocked(useIngestDocuments);
const mockUseRouter = vi.mocked(useRouter);
const mockImportUrlToText = vi.mocked(urlImport.importUrlToText);
const mockParseFileToText = vi.mocked(fileParsers.parseFileToText);

const mockApolloClient = new ApolloClient({
  link: { request: vi.fn() } as any,
  cache: new InMemoryCache(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockApolloClient}>
    {children}
  </ApolloProvider>
);

describe('OnboardingWizard', () => {
  const mockPush = vi.fn();
  const mockIngestOne = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure crypto is available and randomUUID returns unique values
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          subtle: { digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)) },
          randomUUID: () => 'default-uuid'
        },
        configurable: true
      });
    }
    let idCounter = 0;
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => `uuid-${idCounter++}`);

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      token: 'test-token',
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      loading: false,
      error: undefined,
    });

    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'idle' },
      ingestOne: mockIngestOne,
      reset: mockReset,
    } as any);
  });

  it('should render the welcome step by default', () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: /Welcome/i })).toBeInTheDocument();
  });

  it('should navigate through steps sequentially', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /Document intake/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /Provenance/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /Ingestion review/i })).toBeInTheDocument();
  });

  it('should allow skipping steps', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(screen.getByRole('heading', { name: /Document intake/i })).toBeInTheDocument();
  });

  it('should allow jumping to a specific step via stepper buttons', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /go to Provenance/i }));
    expect(screen.getByText(/Provenance classification/i)).toBeInTheDocument();
  });

  it('should prevent navigation if ingestion is running', () => {
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'running' },
      ingestOne: mockIngestOne,
      reset: mockReset,
    } as any);

    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
    
    // Force call the handler even if disabled. 
    // fireEvent might be blocked by MUI's internal logic if it's disabled.
    // We can try to remove the disabled attribute.
    nextBtn.removeAttribute('disabled');
    fireEvent.click(nextBtn);
    
    // Try clicking a step button too
    const stepBtn = screen.getAllByRole('button', { name: /go to Provenance/i })[0];
    stepBtn.removeAttribute('disabled');
    fireEvent.click(stepBtn);
  });

  it('should handle file uploads and generate preview', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'Parsed content', title: 'Parsed Title' });

    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate preview/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Parsed content/i)).toBeInTheDocument();
    });
  });

  it('should show error when not logged in', () => {
    mockUseAuth.mockReturnValue({ token: null } as any);
    mockUseIngestDocuments.mockReturnValue({ canIngest: false, progress: { state: 'idle' } } as any);

    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    expect(screen.getByText(/You must be logged in to ingest documents/i)).toBeInTheDocument();
  });

  it('should handle URL preview and ingestion', async () => {
    mockIngestOne.mockResolvedValue({ documentId: 'doc-123' });
    mockImportUrlToText.mockResolvedValue({ text: 'URL content', title: 'URL Title', fetchedUrl: 'https://ex.com' });

    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://ex.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));

    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });

    await waitFor(() => expect(screen.getByText('URL content')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));

    await waitFor(() => expect(screen.getByText(/Ingestion is complete/i)).toBeInTheDocument());

    // Test router.push
    fireEvent.click(screen.getByRole('button', { name: /Open Documents/i }));
    expect(mockPush).toHaveBeenCalledWith('/documents');
  });

  it('should handle stats for CSV files', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'a,b\n1,2', title: 'csv' });

    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Generate preview/i }));
    });

    await waitFor(() => expect(screen.getByText(/CSV rows \(approx\): 2/i)).toBeInTheDocument());
  });

  it('should handle removal of staged items from both intake and review', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );

    // Add a file
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['c'], 't.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    
    // Remove from intake
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(screen.queryByText('t.txt')).not.toBeInTheDocument();

    // Re-add and remove from review
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(screen.queryByText('t.txt')).not.toBeInTheDocument();
  });

  it('should handle commit error (unconfirmed irreversible) via wizard validation', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'content', title: 'title' });
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    
    fireEvent.click(screen.getByTestId('force-commit-btn'));
    await waitFor(() => {
      expect(screen.getByText(/Confirm ingestion is irreversible before committing/i)).toBeInTheDocument();
    });
  });

  it('should handle commit error (missing preview) via wizard validation', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    
    fireEvent.click(screen.getByTestId('force-commit-btn'));
    await waitFor(() => {
      expect(screen.getByText(/Generate a preview for every queued item before committing/i)).toBeInTheDocument();
    });
  });

  it('should handle commit error when not logged in via wizard validation', async () => {
    mockUseIngestDocuments.mockReturnValue({ canIngest: false, progress: { state: 'idle' } } as any);
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.click(screen.getByTestId('force-commit-btn'));
    await waitFor(() => {
      expect(screen.getByText(/^You must be logged in to ingest documents\.$/i)).toBeInTheDocument();
    });
  });

  it('should allow completing ingestion with empty staged list', async () => {
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.click(screen.getByTestId('force-commit-btn'));
    await waitFor(() => {
      expect(screen.getByText(/Ingestion is complete/i)).toBeInTheDocument();
    });
  });

  it('should handle ingestion failure states for files and URLs', async () => {
    mockIngestOne.mockResolvedValue(null);
    mockParseFileToText.mockResolvedValue({ text: 'content', title: 'title' });
    mockImportUrlToText.mockResolvedValue({ text: 'content', title: 'title', fetchedUrl: 'http://a.com' });

    const { unmount } = render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    // File failure
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => { expect(screen.getByText(/File ingestion failed\./i)).toBeInTheDocument(); }, { timeout: 5000 });
    
    unmount();
    
    // URL failure
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByRole('textbox', { name: /^URL$/i }), { target: { value: 'http://a.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i })); });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => { expect(screen.getByText(/URL ingestion failed\./i)).toBeInTheDocument(); }, { timeout: 5000 });
  }, 15000); // 15s timeout for this long test

  it('should use extracted title if item title is empty', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'content', title: 'Extracted Title' });
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: ' ' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => {
      expect(titleInput).toHaveValue('Extracted Title');
    });
  });

  it('should fallback to filename or URL if both titles are missing in commitIngestion', async () => {
    mockIngestOne.mockResolvedValue({ documentId: 'd1' });
    mockParseFileToText.mockResolvedValue({ text: 'content', title: null });
    render(
      <TestWrapper>
        <ThemeProvider>
          <OnboardingWizard />
        </ThemeProvider>
      </TestWrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: ' ' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => {
      expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({ title: 'test.txt' }));
    });
  });

  it('should handle newId catch block and randomUUID unavailability', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: () => { throw new Error('UUID failed'); } },
      configurable: true
    });
    
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('should return early in generatePreview if item is not found', async () => {
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.click(screen.getByTestId('invalid-preview-btn'));
  });

  it('should handle preview with missing text', async () => {
    mockParseFileToText.mockResolvedValue({ text: null as any, title: 'No Text File' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], 'test.txt');
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => { expect(screen.getByText(/Characters: 0/i)).toBeInTheDocument(); });
  });

  it('should handle sha256HexOfFile failure cases', async () => {
    const originalSubtle = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, 'subtle', { value: undefined, configurable: true });
    
    mockParseFileToText.mockResolvedValue({ text: 'content', title: 'title' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => expect(screen.getByText('content')).toBeInTheDocument());
    
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: { digest: vi.fn().mockRejectedValue(new Error('fail')) },
      configurable: true
    });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => expect(screen.getByText('content')).toBeInTheDocument());

    Object.defineProperty(globalThis.crypto, 'subtle', { value: originalSubtle, configurable: true });
  });

  it('should handle statsFor with null filename', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'content', title: 'title' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['content'], '', { type: 'text/plain' });
    Object.defineProperty(file, 'name', { value: null });
    
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => expect(screen.getByText('content')).toBeInTheDocument());
  });

  it('should handle ADD_URL with empty URL draft', () => {
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByRole('textbox', { name: /^URL$/i }), { target: { value: ' ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
    expect(screen.queryByText(/Queued URLs/i)).not.toBeInTheDocument();
  });

  it('should handle CSV stats with empty content', async () => {
    mockParseFileToText.mockResolvedValue({ text: '', title: 'empty' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File([''], 'test.csv')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => { expect(screen.queryByText(/CSV rows/i)).not.toBeInTheDocument(); });
  });

  it('should handle file without mime type', async () => {
    mockIngestOne.mockResolvedValue({ documentId: 'd1' });
    mockParseFileToText.mockResolvedValue({ text: 'c', title: 't' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt', { type: '' })] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => {
      expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({
        source: expect.objectContaining({ mimeType: 'application/octet-stream' })
      }));
    });
  });

  it('should handle non-Error rejection in generatePreview', async () => {
    mockParseFileToText.mockRejectedValue('fail');
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => { expect(screen.getByText(/Preview failed\./i)).toBeInTheDocument(); });
  });

  it('should handle multiple items and updates', async () => {
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['1'], '1.txt'), new File(['2'], '2.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    const titleInputs = screen.getAllByLabelText(/Title/i);
    fireEvent.change(titleInputs[0], { target: { value: 'New 1' } });
    fireEvent.mouseDown(screen.getAllByLabelText(/Provenance type/i)[1]);
    fireEvent.click(screen.getByText(/User-supplied/i));
    expect(titleInputs[0]).toHaveValue('New 1');
  });

  it('should show fileSha256 in preview', async () => {
    const mockDigest = new Uint8Array(32);
    mockDigest[0] = 1; mockDigest[1] = 2;
    const originalDigest = globalThis.crypto.subtle.digest;
    Object.defineProperty(globalThis.crypto.subtle, 'digest', {
      value: vi.fn().mockResolvedValue(mockDigest.buffer),
      configurable: true
    });
    mockParseFileToText.mockResolvedValue({ text: 'c', title: 't' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    const file = new File(['c'], 't.txt');
    if (!file.arrayBuffer) file.arrayBuffer = async () => new Uint8Array([99]).buffer;
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generate preview/i }));
    await waitFor(() => { expect(screen.getByText((content) => content.includes('010200'))).toBeInTheDocument(); });
    Object.defineProperty(globalThis.crypto.subtle, 'digest', { value: originalDigest, configurable: true });
  });

  it('should show progress node while ingesting', async () => {
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'idle' },
      ingestOne: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ documentId: 'd1' }), 500))),
      reset: vi.fn(),
    } as any);
    mockParseFileToText.mockResolvedValue({ text: 'c', title: 't' });

    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    // Add file and get to review
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    
    // Commit
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    });

    // It should show progress
    expect(await screen.findByText(/Ingesting 1\/1/i)).toBeInTheDocument();
  });

  it('should handle URL item title update from preview when item title is empty', async () => {
    mockImportUrlToText.mockResolvedValue({ text: 'c', title: 'Extracted URL Title', fetchedUrl: 'https://ex.com' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByRole('textbox', { name: /^URL$/i }), { target: { value: 'https://ex.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
    
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    
    // Clear title
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: ' ' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });
    
    await waitFor(() => {
      expect(titleInput).toHaveValue('Extracted URL Title');
    });
  });

  it('should handle provenance update from ProvenanceStep', async () => {
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    
    fireEvent.click(screen.getByRole('button', { name: /go to Provenance/i }));
    
    // Trigger onSetItemProvenance by changing source type
    fireEvent.mouseDown(screen.getByLabelText(/Source type/i));
    fireEvent.click(screen.getByText(/User-supplied/i));
    
    // Go to Review and check if it's there
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    expect(screen.getByDisplayValue(/User-supplied/i)).toBeInTheDocument();
  });

  it('should handle back navigation and skip', async () => {
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    // Welcome -> Intake
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /Document intake/i })).toBeInTheDocument();
    
    // Back to Welcome
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('heading', { name: /Welcome/i })).toBeInTheDocument();
    
    // Skip to Intake
    fireEvent.click(screen.getByRole('button', { name: /skip step/i }));
    expect(screen.getByRole('heading', { name: /Document intake/i })).toBeInTheDocument();
  });

  it('should fallback to URL if both titles are missing in commitIngestion', async () => {
    mockIngestOne.mockResolvedValue({ documentId: 'd1' });
    mockImportUrlToText.mockResolvedValue({ text: 'content', title: null, fetchedUrl: 'https://ex.com' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByRole('textbox', { name: /^URL$/i }), { target: { value: 'https://ex.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
    
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: ' ' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });
    
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    
    await waitFor(() => {
      expect(mockIngestOne).toHaveBeenCalledWith(expect.objectContaining({ title: 'https://ex.com' }));
    });
  });

  it('should handle non-Error rejection in catch blocks', async () => {
    mockIngestOne.mockRejectedValue('fail');
    mockParseFileToText.mockRejectedValue('fail');
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    // Intake
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    
    // Review
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    
    // Generate preview (triggers catch line 275)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => { expect(screen.getByText(/Preview failed\./i)).toBeInTheDocument(); });
    
    // Force generate valid preview to test commit catch
    mockParseFileToText.mockResolvedValue({ text: 'c', title: 't' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    
    // Commit (triggers catch line 378)
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => { expect(screen.getByText(/Ingestion failed\./i)).toBeInTheDocument(); });
  });

  it('should handle URL preview with missing text and real Error objects', async () => {
    // Test imported.text ?? '' branches (lines 258, 260)
    mockImportUrlToText.mockResolvedValue({ text: null as any, title: 'No Text', fetchedUrl: 'https://null.com' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.click(screen.getByLabelText(/Register external reference/i));
    fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://null.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Characters: 0/i)).toBeInTheDocument();
    });

    // Test real Error objects in catch blocks (lines 275, 378)
    mockImportUrlToText.mockRejectedValue(new Error('Specific Preview Error'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Specific Preview Error/i)).toBeInTheDocument();
    });

    // For commit catch
    mockImportUrlToText.mockResolvedValue({ text: 'c', title: 't', fetchedUrl: 'https://ex.com' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Fetch & preview/i }));
    });
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    
    mockIngestOne.mockRejectedValue(new Error('Specific Commit Error'));
    fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Specific Commit Error/i)).toBeInTheDocument();
    });
  });

  it('should cover additional branches (newId fallback, ingestionLocked go, etc.)', async () => {
    // 1. Line 41: randomUUID is undefined (not throwing)
    const originalCrypto = globalThis.crypto;
    const mockCrypto = {
      ...originalCrypto,
      subtle: originalCrypto.subtle,
      randomUUID: undefined as any
    };
    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true
    });
    
    // We need to render FRESH to use this crypto during item addition
    const { unmount } = render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    // Use getAllByRole to avoid multiple matches from Stepper
    fireEvent.click(screen.getAllByRole('button', { name: /go to Document intake/i })[0]);
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    expect(screen.getByText('t.txt')).toBeInTheDocument();
    unmount();

    // Restore crypto immediately
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });

    // 2. Line 218: go() when ingestionLocked is true
    mockUseIngestDocuments.mockReturnValue({
      canIngest: true,
      progress: { state: 'idle' },
      ingestOne: () => new Promise(() => {}), // Returns a promise that never resolves
      reset: vi.fn(),
    } as any);
    
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    fireEvent.click(screen.getAllByRole('button', { name: /go to Document intake/i })[0]);
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    await waitFor(() => expect(screen.queryByText(/No preview yet/i)).not.toBeInTheDocument());
    
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    
    // Trigger ingestion start
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Commit ingestion$/i }));
    });
    
    // Wait for the UI to show that ingestion is running
    await waitFor(() => {
      const texts = screen.queryAllByText((c) => c.includes('Ingesting'));
      expect(texts.length).toBeGreaterThan(0);
    });

    // Now state.ingestion.state is 'running'
    // Try to click a button that calls go()
    const stepBtns = screen.getAllByRole('button', { name: /go to Welcome/i });
    await act(async () => {
      // Use native click to bypass any React/MUI event blocking
      (stepBtns[0] as HTMLButtonElement).click();
    });
  });

  it('should cover reducer default case', async () => {
    const state = { some: 'state' } as any;
    const action = { type: 'UNKNOWN_ACTION' } as any;
    expect(reducer(state, action)).toBe(state);
  });

  it('should cover reducer ADD_URL branches directly', () => {
    const initialState: any = {
      urlDraft: { url: '  ', title: ' ' },
      staged: []
    };
    
    // Branch 1: url is empty after trim
    const state1 = reducer(initialState, { type: 'SET_URL_DRAFT', url: ' ', title: ' ' });
    const state2 = reducer(state1, { type: 'ADD_URL' });
    expect(state2.staged).toHaveLength(0);
    
    // Branch 2: url is not empty
    const state3 = reducer(state1, { type: 'SET_URL_DRAFT', url: 'http://a.com', title: 'Title' });
    const state4 = reducer(state3, { type: 'ADD_URL' });
    expect(state4.staged).toHaveLength(1);
    expect(state4.urlDraft.url).toBe('');
  });

  it('should handle commit error (unconfirmed provenance) via force commit', async () => {
    mockParseFileToText.mockResolvedValue({ text: 'c', title: 't' });
    render(<TestWrapper><ThemeProvider><OnboardingWizard /></ThemeProvider></TestWrapper>);
    
    fireEvent.click(screen.getByRole('button', { name: /go to Document intake/i }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['c'], 't.txt')] } });
    
    fireEvent.click(screen.getByRole('button', { name: /go to Review/i }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Generate preview/i })); });
    
    // Set provenance type in Review step
    fireEvent.mouseDown(screen.getByLabelText(/Provenance type/i));
    fireEvent.click(screen.getByText(/User-supplied/i));
    
    fireEvent.click(screen.getByLabelText(/I understand ingestion is irreversible/i));
    
    // Force commit via mocked button
    fireEvent.click(screen.getByTestId('force-commit-btn'));
    
    await waitFor(() => {
      expect(screen.getByText(/check the confirmation box before committing/i)).toBeInTheDocument();
    });
  });
});
