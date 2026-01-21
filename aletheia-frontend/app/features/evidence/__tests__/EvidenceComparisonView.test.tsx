import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvidenceComparisonView } from '../components/EvidenceComparisonView';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockChunks = [
  { id: 'c1', chunkIndex: 0, content: 'Chunk one content' },
  { id: 'c2', chunkIndex: 1, content: 'Chunk two content' },
];

describe('EvidenceComparisonView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders instructions when no chunks selected', () => {
    render(
      <TestWrapper>
        <EvidenceComparisonView document={null} left={null} right={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Select two chunks to compare/i)).toBeInTheDocument();
  });

  it('renders comparison and handles citation copy', () => {
    // Mock clipboard
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    });

    render(
      <TestWrapper>
        <EvidenceComparisonView
          document={{ id: 'd1' } as any}
          left={mockChunks[0] as any}
          right={mockChunks[1] as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Chunk one content')).toBeInTheDocument();
    expect(screen.getByText('Chunk two content')).toBeInTheDocument();

    const copyBtns = screen.getAllByRole('button', { name: /Copy citation/i });
    fireEvent.click(copyBtns[0]);

    expect(mockWriteText).toHaveBeenCalledWith('Document d1, chunk 0');
  });

  it('handles null document in citation', () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    });

    render(
      <TestWrapper>
        <EvidenceComparisonView
          document={null}
          left={mockChunks[0] as any}
          right={null}
        />
      </TestWrapper>
    );

    const copyBtn = screen.getByRole('button', { name: /Copy citation/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith('Document , chunk 0');
  });

  it('handles citation copy failure', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('failed'));
    vi.stubGlobal('navigator', {
      clipboard: { writeText: mockWriteText },
    });
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);

    render(
      <TestWrapper>
        <EvidenceComparisonView
          document={{ id: 'd1' } as any}
          left={mockChunks[0] as any}
          right={null}
        />
      </TestWrapper>
    );

    const copyBtn = screen.getByRole('button', { name: /Copy citation/i });
    fireEvent.click(copyBtn);

    await waitFor(() => expect(promptSpy).toHaveBeenCalled());
  });
});
