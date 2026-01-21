import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentMetadataPanel } from '../components/DocumentMetadataPanel';
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
    content: '---\ningestedAt: "2023-01-01"\nsource:\n  kind: "file"\n---\nBody text',
  },
];

describe('DocumentMetadataPanel', () => {
  it('renders metadata and toggles raw header', () => {
    render(
      <TestWrapper>
        <DocumentMetadataPanel
          document={mockDoc as any}
          chunks={mockChunks as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('file')).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /Show raw header/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/ingestedAt: "2023-01-01"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Hide raw header/i }));
    expect(screen.queryByText(/ingestedAt: "2023-01-01"/i)).not.toBeInTheDocument();
  });

  it('renders warning when provenance is missing', () => {
    render(
      <TestWrapper>
        <DocumentMetadataPanel
          document={mockDoc as any}
          chunks={[]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Provenance header is missing/i)).toBeInTheDocument();
  });

  it('renders "unknown" when specific provenance fields are missing', () => {
    const chunksMissingFields = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: '---\nsource:\n  other: "field"\n---\nBody text',
      },
    ];
    render(
      <TestWrapper>
        <DocumentMetadataPanel
          document={mockDoc as any}
          chunks={chunksMissingFields as any}
        />
      </TestWrapper>
    );

    // Both source kind and ingestedAt should be "unknown"
    expect(screen.getAllByText('unknown')).toHaveLength(2);
  });

  it('renders info when no document is selected', () => {
    render(
      <TestWrapper>
        <DocumentMetadataPanel
          document={null}
          chunks={[]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Select a document to view metadata/i)).toBeInTheDocument();
  });
});
