import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentInspectionView } from '../components/DocumentInspectionView';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../components/DocumentChunkNavigation', () => ({
  DocumentChunkNavigation: (props: any) => (
    <div data-testid="chunk-nav">
      Chunk Nav
      <button onClick={() => props.onSelectChunkIndex(1)}>Select 1</button>
      <button onClick={() => props.onSelectChunkIndex(999)}>Select 999</button>
    </div>
  )
}));

vi.mock('../../evidence/components/EvidenceTextWithEntityHighlights', () => ({
  EvidenceTextWithEntityHighlights: (props: any) => (
    <div data-testid="text-highlights">
      {props.text}
      <button onClick={() => props.onEntityClick('e1')}>Click E1</button>
    </div>
  )
}));

vi.mock('../components/DocumentEvidencePanel', () => ({
  DocumentEvidencePanel: (props: any) => (
    <div data-testid="evidence-panel">
      Evidence Panel: {props.document?.title}
    </div>
  )
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockChunks = [
  { id: 'c1', chunkIndex: 0, content: 'chunk 0', mentions: [{ entity: { id: 'e2', name: 'B Entity', type: 'Org' } }] },
  { id: 'c2', chunkIndex: 1, content: 'chunk 1', mentions: [{ entity: { id: 'e1', name: 'A Entity', type: 'Person' } }] },
];

const mockDoc = { id: 'd1', title: 'Test Doc', createdAt: '2023-01-01T12:00:00Z' };

describe('DocumentInspectionView', () => {
  it('renders correctly and handles interactions', () => {
    render(
      <TestWrapper>
        <DocumentInspectionView document={mockDoc as any} chunks={mockChunks as any} initialChunkIndex={null} />
      </TestWrapper>
    );

    expect(screen.getByTestId('chunk-nav')).toBeInTheDocument();
    expect(screen.getByTestId('text-highlights')).toHaveTextContent('chunk 0');
    expect(screen.getByTestId('evidence-panel')).toHaveTextContent('Evidence Panel: Test Doc');

    // Test chunk selection
    fireEvent.click(screen.getByText('Select 1'));
    expect(screen.getByTestId('text-highlights')).toHaveTextContent('chunk 1');

    // Test entity click
    fireEvent.click(screen.getByText('Click E1'));
    // Router push is mocked, we just verify it doesn't crash

    // Test selection of non-existent chunk to cover line 67 fallback
    fireEvent.click(screen.getByText('Select 999'));
    expect(screen.getByText(/Showing chunk —/i)).toBeInTheDocument();
  });

  it('handles chunk 0 without provenance header', () => {
    const chunksNoHeader = [
      { id: 'c0', chunkIndex: 0, content: 'Plain chunk 0' },
    ];
    render(
      <TestWrapper>
        <DocumentInspectionView document={mockDoc as any} chunks={chunksNoHeader as any} initialChunkIndex={0} />
      </TestWrapper>
    );

    expect(screen.getByTestId('text-highlights')).toHaveTextContent('Plain chunk 0');
  });

  it('handles unsorted chunks and initial index out of bounds', () => {
    const unsortedChunks = [
      { id: 'c2', chunkIndex: 2, content: 'chunk 2', mentions: [] },
      { id: 'c1', chunkIndex: 1, content: 'chunk 1', mentions: [] },
    ];
    render(
      <TestWrapper>
        <DocumentInspectionView 
          document={mockDoc as any} 
          chunks={unsortedChunks as any} 
          initialChunkIndex={5} 
        />
      </TestWrapper>
    );

    // Should fallback to first sorted chunk (index 1)
    expect(screen.getByTestId('text-highlights')).toHaveTextContent('chunk 1');
  });

  it('handles empty document', () => {
    render(
      <TestWrapper>
        <DocumentInspectionView document={null} chunks={[]} initialChunkIndex={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Inspect a document/i)).toBeInTheDocument();
  });

  it('handles chunk 0 with provenance header', () => {
    const chunksWithProvenance = [
      { id: 'c0', chunkIndex: 0, content: '---\nkey: val\n---\nBody' },
    ];
    render(
      <TestWrapper>
        <DocumentInspectionView document={mockDoc as any} chunks={chunksWithProvenance as any} initialChunkIndex={0} />
      </TestWrapper>
    );

    expect(screen.getByTestId('text-highlights')).toHaveTextContent('Body');
  });

  it('handles missing selected chunk', () => {
    render(
      <TestWrapper>
        <DocumentInspectionView document={mockDoc as any} chunks={[]} initialChunkIndex={5} />
      </TestWrapper>
    );

    expect(screen.getByText(/Showing chunk —/i)).toBeInTheDocument();
  });
});
