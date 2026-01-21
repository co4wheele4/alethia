import { render, screen, fireEvent } from '@testing-library/react';
import { ProvenanceInspector } from '../components/ProvenanceInspector';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockDoc = {
  id: 'd1',
  title: 'Test Document',
  createdAt: '2023-01-01T12:00:00Z',
};

const mockChunks = [
  {
    id: 'c1',
    chunkIndex: 0,
    content: '---\ningestedAt: "2023-01-01"\ncontentSha256: "abc"\nsource:\n  kind: "file"\n  filename: "test.txt"\n---\nBody text',
  },
];

describe('ProvenanceInspector', () => {
  it('renders correctly and toggles raw header', () => {
    render(
      <TestWrapper>
        <ProvenanceInspector
          document={mockDoc as any}
          chunks={mockChunks as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('file')).toBeInTheDocument();
    expect(screen.getByText('abc')).toBeInTheDocument();
    expect(screen.getByText('test.txt')).toBeInTheDocument();

    const toggleBtn = screen.getByText('Show raw header');
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/ingestedAt: "2023-01-01"/)).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Hide raw header'));
    expect(screen.queryByText(/ingestedAt: "2023-01-01"/)).not.toBeInTheDocument();
  });

  it('renders info when no document selected', () => {
    render(
      <TestWrapper>
        <ProvenanceInspector document={null} chunks={[]} />
      </TestWrapper>
    );
    expect(screen.getByText(/Select a document/i)).toBeInTheDocument();
  });

  it('renders warning when no chunk 0', () => {
    render(
      <TestWrapper>
        <ProvenanceInspector document={mockDoc as any} chunks={[]} />
      </TestWrapper>
    );
    expect(screen.getByText(/No chunk 0 available/i)).toBeInTheDocument();
  });

  it('renders warning when no provenance header', () => {
    const chunksNoHeader = [{ id: 'c1', chunkIndex: 0, content: 'Plain text' }];
    render(
      <TestWrapper>
        <ProvenanceInspector document={mockDoc as any} chunks={chunksNoHeader as any} />
      </TestWrapper>
    );
    expect(screen.getByText(/does not contain a provenance header/i)).toBeInTheDocument();
  });

  it('handles missing ingestedAt and contentSha256', () => {
    const mockChunksMissing = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\nsource:\n  kind: "manual"\n---\nBody text',
      },
    ];
    render(
      <TestWrapper>
        <ProvenanceInspector
          document={mockDoc as any}
          chunks={mockChunksMissing as any}
        />
      </TestWrapper>
    );
    expect(screen.getByText(/Ingested at/i).nextElementSibling).toHaveTextContent('unknown');
    expect(screen.queryByText(/Content SHA-256/i)).not.toBeInTheDocument();
  });

  it('handles missing source kind and URL', () => {
    const mockChunksNoKind = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\ningestedAt: "2023-01-01"\nsource:\n  url: \n---\nBody text',
      },
    ];
    render(
      <TestWrapper>
        <ProvenanceInspector
          document={mockDoc as any}
          chunks={mockChunksNoKind as any}
        />
      </TestWrapper>
    );
    
    // Find the Source kind label and check its sibling
    const sourceKindLabel = screen.getByText('Source kind');
    expect(sourceKindLabel.nextElementSibling).toHaveTextContent('unknown');
  });

  it('renders URL when kind is url', () => {
    const mockChunksUrl = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\nsource:\n  kind: "url"\n  url: "https://ex.com"\n---\nBody',
      },
    ];
    render(
      <TestWrapper>
        <ProvenanceInspector document={mockDoc as any} chunks={mockChunksUrl as any} />
      </TestWrapper>
    );
    expect(screen.getByText('https://ex.com')).toBeInTheDocument();
    
    // Test URL being empty - this should hit the || '' branch
    const mockChunksUrlEmpty = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\nsource:\n  kind: "url"\n  url: \n---\nBody',
      },
    ];
    render(
      <TestWrapper>
        <ProvenanceInspector document={mockDoc as any} chunks={mockChunksUrlEmpty as any} />
      </TestWrapper>
    );
  });

  it('renders empty string for filename when missing and kind is file', () => {
    const mockChunksMissingFilename = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\ningestedAt: "2023-01-01"\nsource:\n  kind: "file"\n---\nBody text',
      },
    ];
    render(
      <TestWrapper>
        <ProvenanceInspector
          document={mockDoc as any}
          chunks={mockChunksMissingFilename as any}
        />
      </TestWrapper>
    );
    expect(screen.getByText('Filename (ingestion artifact)')).toBeInTheDocument();
  });
});
