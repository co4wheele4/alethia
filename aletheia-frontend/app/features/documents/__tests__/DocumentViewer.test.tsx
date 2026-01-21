import { render, screen, fireEvent, act } from '@testing-library/react';
import { DocumentViewer } from '../components/DocumentViewer';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

// Mock child components
vi.mock('../components/DocumentSectionNav', () => ({
  DocumentSectionNav: (props: any) => (
    <div data-testid="section-nav">
      Section Nav
      <button onClick={() => props.onSelectChunkIndex(1)}>Select 1</button>
      <button onClick={() => props.onSelectChunkIndex(999)}>Select 999</button>
      <button onClick={() => props.onSelectChunkIndex(null)}>Select Null</button>
    </div>
  )
}));

vi.mock('../../evidence/components/EvidenceHighlightLayer', () => ({
  EvidenceHighlightLayer: (props: any) => (
    <div data-testid="highlight-layer">
      Text: {props.text} | Query: {props.query}
    </div>
  )
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockChunks = [
  { id: 'c1', chunkIndex: 0, content: 'chunk 0 content' },
  { id: 'c2', chunkIndex: 1, content: 'chunk 1 content' },
];

describe('DocumentViewer', () => {
  it('renders correctly and handles search', () => {
    render(
      <TestWrapper>
        <DocumentViewer chunks={mockChunks as any} />
      </TestWrapper>
    );

    expect(screen.getByTestId('section-nav')).toBeInTheDocument();
    expect(screen.getByTestId('highlight-layer')).toHaveTextContent('Text: chunk 0 content');

    // Test search
    const searchInput = screen.getByLabelText(/Search/i);
    fireEvent.change(searchInput, { target: { value: 'my query' } });
    expect(screen.getByTestId('highlight-layer')).toHaveTextContent('Query: my query');
  });

  it('handles empty chunks', () => {
    render(
      <TestWrapper>
        <DocumentViewer chunks={[]} />
      </TestWrapper>
    );

    expect(screen.getByText(/No chunks available/i)).toBeInTheDocument();
  });

  it('handles chunk selection', () => {
    render(
      <TestWrapper>
        <DocumentViewer chunks={mockChunks as any} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Select 1'));
    expect(screen.getByTestId('highlight-layer')).toHaveTextContent('Text: chunk 1 content');
    
    fireEvent.click(screen.getByText('Select 999'));
    expect(screen.queryByTestId('highlight-layer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Select Null'));
    expect(screen.queryByTestId('highlight-layer')).not.toBeInTheDocument();
  });

  it('handles chunk 0 with provenance header', () => {
    const chunksWithProvenance = [
      { id: 'c0', chunkIndex: 0, content: '---\nkey: val\n---\nBody text' },
    ];
    render(
      <TestWrapper>
        <DocumentViewer chunks={chunksWithProvenance as any} />
      </TestWrapper>
    );

    expect(screen.getByTestId('highlight-layer')).toHaveTextContent('Text: Body text');
  });

  it('handles citation copy to clipboard', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    render(
      <TestWrapper>
        <DocumentViewer chunks={mockChunks as any} />
      </TestWrapper>
    );

    const copyBtn = screen.getByRole('button', { name: /Copy citation/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('chunk 0');
  });

  it('fallbacks to prompt when clipboard fails', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('fail')),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);

    render(
      <TestWrapper>
        <DocumentViewer chunks={mockChunks as any} />
      </TestWrapper>
    );

    const copyBtn = screen.getByRole('button', { name: /Copy citation/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(promptSpy).toHaveBeenCalledWith('Copy citation:', 'chunk 0');
  });

  it('handles missing selected chunk fallback citation', async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    render(
      <TestWrapper>
        <DocumentViewer chunks={mockChunks as any} />
      </TestWrapper>
    );

    // Select null via mocked nav
    fireEvent.click(screen.getByText('Select Null'));

    const copyBtn = screen.getByRole('button', { name: /Copy citation/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('chunk —');
  });
});
