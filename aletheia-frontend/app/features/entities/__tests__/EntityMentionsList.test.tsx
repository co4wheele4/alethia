import { render, screen, fireEvent } from '@testing-library/react';
import { EntityMentionsList } from '../components/EntityMentionsList';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockMentions = [
  {
    id: 'm1',
    startOffset: 0,
    endOffset: 5,
    chunk: {
      id: 'c1',
      chunkIndex: 0,
      content: 'Hello world. This is a mention.',
      document: {
        id: 'd1',
        title: 'Doc One',
        createdAt: '2023-01-01T12:00:00Z',
      },
    },
  },
  {
    id: 'm2',
    startOffset: null, // Legacy mention
    endOffset: null,
    chunk: {
      id: 'c2',
      chunkIndex: 1,
      content: 'Another chunk without span.',
      document: {
        id: 'd1',
        title: 'Doc One',
        createdAt: '2023-01-01T12:00:00Z',
      },
    },
  },
];

describe('EntityMentionsList', () => {
  it('renders mentions correctly', () => {
    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType="Person"
          mentions={mockMentions as any}
        />
      </TestWrapper>
    );

    expect(screen.getAllByText('Doc One').length).toBeGreaterThan(0);
    expect(screen.getByText(/Chunk 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello world/i)).toBeInTheDocument();
    
    // Check legacy warning
    expect(screen.getByText(/Some mentions have/i)).toBeInTheDocument();
  });

  it('filters mentions by text', () => {
    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType="Person"
          mentions={mockMentions as any}
        />
      </TestWrapper>
    );

    const filterInput = screen.getByLabelText(/Filter mentions by literal text/i);
    fireEvent.change(filterInput, { target: { value: 'Hello' } });

    expect(screen.getByText(/Hello world/i)).toBeInTheDocument();
    expect(screen.queryByText(/Another chunk/i)).not.toBeInTheDocument();
  });

  it('toggles accordion details', () => {
    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType="Person"
          mentions={mockMentions as any}
        />
      </TestWrapper>
    );

    const accordionSummary = screen.getAllByText('Doc One');
    fireEvent.click(accordionSummary[0]);

    // After clicking, the info should be present. Use getAllByText as it exists in multiple accordions.
    expect(screen.getAllByText(/Entity: Test Entity/i).length).toBeGreaterThan(0);
  });

  it('renders unknown type and shows message when no filter matches', () => {
    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType=""
          mentions={mockMentions as any}
        />
      </TestWrapper>
    );

    const accordionSummary = screen.getAllByText('Doc One')[0];
    fireEvent.click(accordionSummary);
    expect(screen.getAllByText(/Type: unknown/i).length).toBeGreaterThan(0);

    const filterInput = screen.getByLabelText(/Filter mentions by literal text/i);
    fireEvent.change(filterInput, { target: { value: 'Nonexistent' } });
    expect(screen.getByText(/No mentions match your filter/i)).toBeInTheDocument();
  });

  it('handles load more button and long excerpt', () => {
    const manyMentions = Array.from({ length: 25 }, (_, i) => ({
      id: `m${i}`,
      startOffset: 0,
      endOffset: 5,
      chunk: {
        id: `c${i}`,
        chunkIndex: i,
        content: 'Long text '.repeat(50) + `mention ${i}`,
        document: {
          id: 'd1',
          title: 'Doc One',
          createdAt: '2023-01-01T12:00:00Z',
        },
      },
    }));

    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType="Person"
          mentions={manyMentions as any}
        />
      </TestWrapper>
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Load more mentions/i });
    fireEvent.click(loadMoreBtn);
    expect(screen.getByText(/mention 22/i)).toBeInTheDocument();
  });

  it('renders info when no mentions', () => {
    render(
      <TestWrapper>
        <EntityMentionsList
          entityId="e1"
          entityName="Test Entity"
          entityType="Person"
          mentions={[]}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No mentions are available/i)).toBeInTheDocument();
  });
});
