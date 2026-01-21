import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentEvidencePanel } from '../components/DocumentEvidencePanel';
import { ThemeProvider } from '../../../hooks/useTheme';
import { MockedProvider } from '@apollo/client/testing/react';
import { vi } from 'vitest';

vi.mock('../components/DocumentMetadataPanel', () => ({
  DocumentMetadataPanel: (props: any) => (
    <div data-testid="metadata-panel">
      Metadata: {props.document?.title}
    </div>
  )
}));

vi.mock('../../extraction/components/SuggestedExtractionsPanel', () => ({
  SuggestedExtractionsPanel: (props: any) => (
    <div data-testid="extractions-panel">
      Extractions: {props.chunkId}
    </div>
  )
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </ThemeProvider>
);

const mockDoc = { id: 'd1', title: 'Test Doc', createdAt: '2023-01-01T12:00:00Z' };
const mockChunks = [
  {
    id: 'c1',
    chunkIndex: 0,
    content: 'chunk 0',
    mentions: [
      { id: 'm1', entity: { id: 'e1', name: 'E1', type: 'Person' } }
    ]
  }
];

describe('DocumentEvidencePanel', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc as any}
          chunks={mockChunks as any}
          selectedChunk={mockChunks[0] as any}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('metadata-panel')).toHaveTextContent('Metadata: Test Doc');
    expect(screen.getByTestId('extractions-panel')).toHaveTextContent('Extractions: c1');
    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.getByText(/Type: Person/i)).toBeInTheDocument();
  });

  it('handles load more entities', () => {
    const manyChunks = Array.from({ length: 60 }, (_, i) => ({
      id: `c${i}`,
      chunkIndex: i,
      content: `chunk ${i}`,
      mentions: [{ id: `m${i}`, entity: { id: `e${i}`, name: `E${i}`, type: 'Person' } }]
    }));

    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc as any}
          chunks={manyChunks as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('E0')).toBeInTheDocument();
    expect(screen.queryByText('E55')).not.toBeInTheDocument();

    const loadMoreBtn = screen.getByText(/Load more entities/i);
    fireEvent.click(loadMoreBtn);

    expect(screen.getByText('E55')).toBeInTheDocument();
  });

  it('renders empty message when no entities', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc as any}
          chunks={[{ id: 'c1', chunkIndex: 0, content: 'no mentions', mentions: [] }]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No entity mentions were returned/i)).toBeInTheDocument();
  });

  it('handles entities with missing type', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc as any}
          chunks={[
            {
              id: 'c1',
              chunkIndex: 0,
              content: 'chunk 0',
              mentions: [{ id: 'm1', entity: { id: 'e1', name: 'E1', type: '' } }]
            }
          ]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Type: unknown/i)).toBeInTheDocument();
  });

  it('handles chunks with null mentions', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc as any}
          chunks={[{ id: 'c1', chunkIndex: 0, content: 'no mentions', mentions: null }]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No entity mentions were returned/i)).toBeInTheDocument();
  });
});
