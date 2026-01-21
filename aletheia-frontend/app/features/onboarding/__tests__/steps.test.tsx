import { render, screen, fireEvent } from '@testing-library/react';
import { IntakeStep } from '../steps/IntakeStep';
import { ProvenanceStep } from '../steps/ProvenanceStep';
import { ReviewStep } from '../steps/ReviewStep';
import { CompletionStep } from '../steps/CompletionStep';
import { WelcomeStep } from '../steps/WelcomeStep';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';
import { useRef, useEffect } from 'react';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Onboarding Steps', () => {
  describe('WelcomeStep', () => {
    it('renders welcome message', () => {
      render(
        <TestWrapper>
          <WelcomeStep />
        </TestWrapper>
      );
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });
  });

  describe('IntakeStep', () => {
    const mockStaged = [
      { id: '1', kind: 'file', file: new File([''], 'test.txt'), title: 'File 1', provenance: { type: null, label: '', confirmed: false } },
      { id: '2', kind: 'url', url: 'https://ex.com', title: 'URL 1', provenance: { type: null, label: '', confirmed: false } },
    ];

    it('renders and handles interactions', () => {
      const onModeChange = vi.fn();
      const onRemoveStaged = vi.fn();
      const onUrlDraftChange = vi.fn();
      const onAddUrl = vi.fn();

      render(
        <TestWrapper>
          <IntakeStep
            mode="file"
            staged={mockStaged as any}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={onModeChange}
            onAddFiles={vi.fn()}
            onRemoveStaged={onRemoveStaged}
            onUrlDraftChange={onUrlDraftChange}
            onAddUrl={onAddUrl}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Document intake/i)).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();

      // Switch to URL mode
      fireEvent.click(screen.getByLabelText(/Register external reference/i));
      expect(onModeChange).toHaveBeenCalledWith('url');

      // Remove item
      const removeBtns = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeBtns[0]);
      expect(onRemoveStaged).toHaveBeenCalledWith('1');
    });

    it('renders staged items with fallback labels and handles URL removal', () => {
      const onRemoveStaged = vi.fn();
      const stagedWithFallbacks = [
        { id: '1', kind: 'file', file: { name: 'fallback-file.txt' }, title: '', provenance: { type: null, label: '', confirmed: false } },
        { id: '2', kind: 'url', url: 'https://fallback-url.com', title: '', provenance: { type: null, label: '', confirmed: false } },
      ];
      
      const { unmount } = render(
        <TestWrapper>
          <IntakeStep
            mode="file"
            staged={stagedWithFallbacks as any}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={onRemoveStaged}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        </TestWrapper>
      );
      expect(screen.getByText('fallback-file.txt')).toBeInTheDocument();
      unmount();
      
      render(
        <TestWrapper>
          <IntakeStep
            mode="url"
            staged={stagedWithFallbacks as any}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={onRemoveStaged}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        </TestWrapper>
      );
      // Appears twice because of fallback title and the url caption
      expect(screen.getAllByText('https://fallback-url.com').length).toBeGreaterThan(0);
      
      const removeBtns = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeBtns[0]);
      expect(onRemoveStaged).toHaveBeenCalledWith('2');
    });

    it('handles URL draft changes and adding', () => {
      const onUrlDraftChange = vi.fn();
      const onAddUrl = vi.fn();

      render(
        <TestWrapper>
          <IntakeStep
            mode="url"
            staged={[]}
            urlDraft={{ url: 'https://abc.com', title: 'ABC' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={vi.fn()}
            onUrlDraftChange={onUrlDraftChange}
            onAddUrl={onAddUrl}
          />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://new.com' } });
      expect(onUrlDraftChange).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://new.com' }));

      // Update title in draft
      fireEvent.change(screen.getByLabelText(/Title \(optional\)/i), { target: { value: 'New Title' } });
      expect(onUrlDraftChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));

      fireEvent.click(screen.getByRole('button', { name: /Add URL to queue/i }));
      expect(onAddUrl).toHaveBeenCalled();

      // Clear draft
      fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
      expect(onUrlDraftChange).toHaveBeenCalledWith({ url: '', title: '' });
    });

    it('handles file input clicks', () => {
      let clickCalled = false;
      const TestComponent = () => {
        const ref = useRef<HTMLInputElement>(null);
        useEffect(() => {
          if (ref.current) {
            ref.current.click = () => {
              clickCalled = true;
            };
          }
        });
        return (
          <IntakeStep
            mode="file"
            staged={[]}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={ref}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={vi.fn()}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByLabelText(/file-dropzone/i));
      expect(clickCalled).toBe(true);
    });

    it('triggers onAddFiles on input change', () => {
      const onAddFiles = vi.fn();
      render(
        <TestWrapper>
          <IntakeStep
            mode="file"
            staged={[]}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={onAddFiles}
            onRemoveStaged={vi.fn()}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        </TestWrapper>
      );
      const input = document.querySelector('input[type="file"]')!;
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onAddFiles).toHaveBeenCalled();
    });

    it('renders "File" fallback when it.file.name is missing', () => {
      const stagedWithMissingName = [
        { id: '1', kind: 'file', file: { name: undefined }, title: undefined, provenance: { confirmed: false } },
      ];
      render(
        <TestWrapper>
          <IntakeStep
            mode="file"
            staged={stagedWithMissingName as any}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={vi.fn()}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        </TestWrapper>
      );
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('renders URL as fallback for URL when title is missing', () => {
      const stagedWithMissingTitle = [
        { id: '1', kind: 'url', url: 'https://ex.com', title: '', provenance: { confirmed: false } },
      ];
      render(
        <TestWrapper>
          <IntakeStep
            mode="url"
            staged={stagedWithMissingTitle as any}
            urlDraft={{ url: '', title: '' }}
            fileInputRef={{ current: null }}
            onModeChange={vi.fn()}
            onAddFiles={vi.fn()}
            onRemoveStaged={vi.fn()}
            onUrlDraftChange={vi.fn()}
            onAddUrl={vi.fn()}
          />
        </TestWrapper>
      );
      // It should show 'https://ex.com' twice (title and caption)
      expect(screen.getAllByText('https://ex.com').length).toBe(2);
    });
  });

  describe('ProvenanceStep', () => {
    const mockStaged = [
      {
        id: '1',
        kind: 'manual',
        title: 'Manual Item',
        text: 'Text',
        provenance: { type: null, label: '', confirmed: false },
      },
    ];

    it('renders staged items and handles changes', () => {
      const onSetItemProvenance = vi.fn();
      render(
        <TestWrapper>
          <ProvenanceStep
            staged={mockStaged as any}
            onSetItemProvenance={onSetItemProvenance}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Manual Item')).toBeInTheDocument();

      // Change label
      const labelInput = screen.getByLabelText(/Optional source label/i);
      fireEvent.change(labelInput, { target: { value: 'New Label' } });
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ label: 'New Label' }));

      // Change type
      fireEvent.mouseDown(screen.getByLabelText(/Source type/i));
      fireEvent.click(screen.getByText(/User-supplied/i));
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ type: 'user-supplied' }));

      // Confirm
      fireEvent.click(screen.getByLabelText(/I confirm this describes/i));
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ confirmed: true }));
    });

    it('renders fallback labels and handles unset type and URL title fallback', () => {
      const onSetItemProvenance = vi.fn();
      const stagedWithFallbacks = [
        { id: '1', kind: 'file', file: { name: 'f.txt' }, title: '', provenance: { type: 'scraped', label: '', confirmed: false } },
        { id: '2', kind: 'url', url: 'https://fallback-url.com', title: '', provenance: { type: null, label: '', confirmed: false } },
      ];
      render(
        <TestWrapper>
          <ProvenanceStep
            staged={stagedWithFallbacks as any}
            onSetItemProvenance={onSetItemProvenance}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('f.txt').length).toBeGreaterThan(0);
      expect(screen.getByText(/Collected from the web/i)).toBeInTheDocument();
      
      // Check for the URL fallback in the title
      expect(screen.getAllByText('https://fallback-url.com').length).toBeGreaterThan(1);

      // Unset type
      const selects = screen.getAllByLabelText(/Source type/i);
      fireEvent.mouseDown(selects[0]);
      fireEvent.click(screen.getByText(/Unset \(skip for now\)/i));
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ type: null }));
    });

    it('renders warning when no staged items', () => {
      render(
        <TestWrapper>
          <ProvenanceStep staged={[]} onSetItemProvenance={vi.fn()} />
        </TestWrapper>
      );
      expect(screen.getByText(/No sources queued yet/i)).toBeInTheDocument();
    });
  });

  describe('ReviewStep', () => {
    const mockStaged = [
      { id: '1', kind: 'file', file: new File([''], 'test.txt'), title: 'File 1', provenance: { type: null, label: '', confirmed: false } },
    ];
    const mockReview = {
      previewsById: {},
      previewBusyById: {},
      previewErrorById: {},
      irreversibleConfirmed: false,
    };

    it('handles interactions and summary actions', () => {
      const onUpdateItemTitle = vi.fn();
      const onSetIrreversibleConfirmed = vi.fn();
      const onCommitIngestion = vi.fn();
      const onRemoveStaged = vi.fn();
      const onSetItemProvenance = vi.fn();

      render(
        <TestWrapper>
          <ReviewStep
            staged={mockStaged as any}
            review={{ ...mockReview, irreversibleConfirmed: true } as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={onUpdateItemTitle}
            onSetItemProvenance={onSetItemProvenance}
            onRemoveStaged={onRemoveStaged}
            onSetIrreversibleConfirmed={onSetIrreversibleConfirmed}
            onCommitIngestion={onCommitIngestion}
          />
        </TestWrapper>
      );

      // Update title
      const titleInput = screen.getByLabelText(/Title/i);
      fireEvent.change(titleInput, { target: { value: 'New Title' } });
      expect(onUpdateItemTitle).toHaveBeenCalledWith('1', 'New Title');

      // Update provenance type
      fireEvent.mouseDown(screen.getByLabelText(/Provenance type/i));
      fireEvent.click(screen.getByText(/User-supplied/i));
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ type: 'user-supplied' }));

      // Update provenance label
      const labelInput = screen.getByLabelText(/Provenance label \(optional\)/i);
      fireEvent.change(labelInput, { target: { value: 'Ref 123' } });
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ label: 'Ref 123' }));

      // Remove item
      const removeBtn = screen.getByRole('button', { name: /Remove/i });
      fireEvent.click(removeBtn);
      expect(onRemoveStaged).toHaveBeenCalledWith('1');

      // Irreversible checkbox
      const irreversibleCheckbox = screen.getByLabelText(/I understand ingestion is irreversible/i);
      fireEvent.click(irreversibleCheckbox);
      expect(onSetIrreversibleConfirmed).toHaveBeenCalled();
    });

    it('renders preview with excerpt and formatted size and extra metadata', () => {
      const longText = 'A'.repeat(1000);
      const stagedLarge = [
        { id: '1', kind: 'file', file: { name: 'large.txt', size: 2048, type: 'text/plain', lastModified: Date.now() }, title: 'L', provenance: { confirmed: false } },
        { id: '2', kind: 'url', url: 'https://ex.com', title: 'U', provenance: { confirmed: false } }
      ];
      const reviewWithLarge = {
        ...mockReview,
        previewsById: {
          '1': {
            text: longText,
            stats: { characters: 1000, lines: 1, words: 1, chunkCount: 1, csvRows: 100 },
            fileMeta: { fileSha256: 'sha256-abc' }
          },
          '2': {
            text: 'URL content',
            stats: { characters: 11, lines: 1, words: 2, chunkCount: 1 },
            urlMeta: { fetchedUrl: 'https://ex.com', contentType: 'text/html', publisher: 'Publisher X' }
          }
        },
      };

      const onGeneratePreview = vi.fn();

      render(
        <TestWrapper>
          <ReviewStep
            staged={stagedLarge as any}
            review={reviewWithLarge as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={onGeneratePreview}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={vi.fn()}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/2.0 KB/i)).toBeInTheDocument();
      expect(screen.getByText(/A…/i)).toBeInTheDocument();
      expect(screen.getByText(/CSV rows \(approx\): 100/i)).toBeInTheDocument();
      expect(screen.getByText(/fileSha256: sha256-abc/i)).toBeInTheDocument();
      expect(screen.getByText(/contentType: text\/html/i)).toBeInTheDocument();
      expect(screen.getByText(/publisher: Publisher X/i)).toBeInTheDocument();
      
      const fetchBtn = screen.getByRole('button', { name: /Fetch & preview/i });
      fireEvent.click(fetchBtn);
      expect(onGeneratePreview).toHaveBeenCalledWith('2');
    });

    it('renders ingestion progress node', () => {
      render(
        <TestWrapper>
          <ReviewStep
            staged={[]}
            review={mockReview as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            ingestProgressNode={<div data-testid="progress-node">Progress</div>}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={vi.fn()}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={vi.fn()}
          />
        </TestWrapper>
      );
      expect(screen.getByTestId('progress-node')).toBeInTheDocument();
    });

    it('handles provenance confirmation in ReviewStep', () => {
      const onSetItemProvenance = vi.fn();
      const stagedWithType = [
        { ...mockStaged[0], provenance: { type: 'scraped', label: '', confirmed: false } }
      ];
      render(
        <TestWrapper>
          <ReviewStep
            staged={stagedWithType as any}
            review={mockReview as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={onSetItemProvenance}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={vi.fn()}
          />
        </TestWrapper>
      );

      const checkbox = screen.getByLabelText(/I confirm this describes how the source was obtained/i);
      fireEvent.click(checkbox);
      expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ confirmed: true }));
    });

    it('enables commit button when all previews are ready and irreversible confirmed', () => {
      const onCommitIngestion = vi.fn();
      const stagedWithPreviews = [
        { id: '1', kind: 'file', file: new File([''], 't.txt'), title: 'T', provenance: { confirmed: true, type: 'user-supplied' } }
      ];
      const reviewWithPreviews = {
        ...mockReview,
        previewsById: { '1': { text: '...', stats: {} } },
        irreversibleConfirmed: true,
      };

      render(
        <TestWrapper>
          <ReviewStep
            staged={stagedWithPreviews as any}
            review={reviewWithPreviews as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={vi.fn()}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={onCommitIngestion}
          />
        </TestWrapper>
      );

      const commitBtn = screen.getByRole('button', { name: /Commit ingestion/i });
      expect(commitBtn).not.toBeDisabled();
      fireEvent.click(commitBtn);
      expect(onCommitIngestion).toHaveBeenCalled();
    });

    it('renders loading and error states for preview', () => {
      const reviewWithStates = {
        ...mockReview,
        previewBusyById: { '1': true },
        previewErrorById: { '1': 'Some error' },
      };
      render(
        <TestWrapper>
          <ReviewStep
            staged={mockStaged as any}
            review={reviewWithStates as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={vi.fn()}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/preview busy/i)).toBeInTheDocument();
      expect(screen.getByText(/Some error/i)).toBeInTheDocument();
    });

        it('renders ingestion error state with fallback message', () => {
          render(
            <TestWrapper>
              <ReviewStep
                staged={mockStaged as any}
                review={mockReview as any}
                ingestion={{ state: 'error', currentIndex: 0, results: [], errorMessage: undefined }}
                onGeneratePreview={vi.fn()}
                onUpdateItemTitle={vi.fn()}
                onSetItemProvenance={vi.fn()}
                onRemoveStaged={vi.fn()}
                onSetIrreversibleConfirmed={vi.fn()}
                onCommitIngestion={vi.fn()}
              />
            </TestWrapper>
          );

          expect(screen.getByText(/Ingestion failed\./i)).toBeInTheDocument();
        });

        it('handles provenance type change to unset', () => {
          const onSetItemProvenance = vi.fn();
          const stagedWithType = [
            { ...mockStaged[0], provenance: { type: 'scraped', label: '', confirmed: true } }
          ];
          render(
            <TestWrapper>
              <ReviewStep
                staged={stagedWithType as any}
                review={mockReview as any}
                ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
                onGeneratePreview={vi.fn()}
                onUpdateItemTitle={vi.fn()}
                onSetItemProvenance={onSetItemProvenance}
                onRemoveStaged={vi.fn()}
                onSetIrreversibleConfirmed={vi.fn()}
                onCommitIngestion={vi.fn()}
              />
            </TestWrapper>
          );

          fireEvent.mouseDown(screen.getByLabelText(/Provenance type/i));
          fireEvent.click(screen.getByText(/Unset/i));
          expect(onSetItemProvenance).toHaveBeenCalledWith('1', expect.objectContaining({ type: null, confirmed: false }));
        });

        it('handles fmtBytes with invalid input', () => {
          // Since fmtBytes is not exported, we test it through ReviewStep metadata rendering
          const stagedInvalidSize = [
            { id: '1', kind: 'file', file: { name: 'n.txt', size: NaN, type: '', lastModified: 0 }, title: 'T', provenance: { confirmed: false } }
          ];
          render(
            <TestWrapper>
              <ReviewStep
                staged={stagedInvalidSize as any}
                review={mockReview as any}
                ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
                onGeneratePreview={vi.fn()}
                onUpdateItemTitle={vi.fn()}
                onSetItemProvenance={vi.fn()}
                onRemoveStaged={vi.fn()}
                onSetIrreversibleConfirmed={vi.fn()}
                onCommitIngestion={vi.fn()}
              />
            </TestWrapper>
          );
          // Metadata should not show "Size: NaN B" or similar if handled
          expect(screen.queryByText(/Size: \d/)).not.toBeInTheDocument();
        });

        it('renders empty message for zero staged items', () => {
      render(
        <TestWrapper>
          <ReviewStep
            staged={[]}
            review={mockReview as any}
            ingestion={{ state: 'idle', currentIndex: 0, results: [] }}
            onGeneratePreview={vi.fn()}
            onUpdateItemTitle={vi.fn()}
            onSetItemProvenance={vi.fn()}
            onRemoveStaged={vi.fn()}
            onSetIrreversibleConfirmed={vi.fn()}
            onCommitIngestion={vi.fn()}
          />
        </TestWrapper>
      );
      expect(screen.getByText(/No sources queued yet/i)).toBeInTheDocument();
    });
  });

  describe('CompletionStep', () => {
    it('renders created document IDs', () => {
      const createdDocumentIds = ['d1', 'd2'];
      render(
        <TestWrapper>
          <CompletionStep createdDocumentIds={createdDocumentIds} />
        </TestWrapper>
      );

      expect(screen.getByText('d1')).toBeInTheDocument();
      expect(screen.getByText('d2')).toBeInTheDocument();
    });

    it('renders info when no documents created', () => {
      render(
        <TestWrapper>
          <CompletionStep createdDocumentIds={[]} />
        </TestWrapper>
      );

      expect(screen.getByText(/No documents were ingested/i)).toBeInTheDocument();
    });
  });
});
