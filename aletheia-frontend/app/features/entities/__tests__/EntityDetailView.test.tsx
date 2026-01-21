import { render, screen } from '@testing-library/react';
import { EntityDetailView } from '../components/EntityDetailView';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../components/EntityRelationshipGraph', () => ({
  EntityRelationshipGraph: () => <div data-testid="relationship-graph">Relationship Graph</div>
}));

vi.mock('../components/EntityMentionsList', () => ({
  EntityMentionsList: () => <div data-testid="mentions-list">Mentions List</div>
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockEntity = {
  id: 'e1',
  name: 'Test Entity',
  type: 'Person',
  mentionCount: 5,
  mentions: [],
  outgoing: [],
  incoming: [],
};

describe('EntityDetailView', () => {
  it('renders loading state', () => {
    render(
      <TestWrapper>
        <EntityDetailView entity={null} loading={true} error={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading entity/i)).toBeInTheDocument();
  });

  it('renders entity details', () => {
    render(
      <TestWrapper>
        <EntityDetailView entity={mockEntity as any} loading={false} error={null} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Entity')).toBeInTheDocument();
    expect(screen.getByText(/Type: Person/i)).toBeInTheDocument();
    expect(screen.getByTestId('relationship-graph')).toBeInTheDocument();
    expect(screen.getByTestId('mentions-list')).toBeInTheDocument();
  });

  it('renders provenance alert when chunk0 is present and sorts by date', () => {
    const entityWithChunk0 = {
      ...mockEntity,
      mentions: [
        {
          id: 'm2',
          chunk: {
            id: 'c2',
            chunkIndex: 0,
            content: '---\ningestedAt: "2023-01-02"\n---\nBody 2',
            document: { id: 'd2', createdAt: '2023-01-02T00:00:00Z' }
          }
        },
        {
          id: 'm1',
          chunk: {
            id: 'c1',
            chunkIndex: 0,
            content: '---\ningestedAt: "2023-01-01"\n---\nBody 1',
            document: { id: 'd1', createdAt: '2023-01-01T00:00:00Z' }
          }
        }
      ]
    };

    render(
      <TestWrapper>
        <EntityDetailView entity={entityWithChunk0 as any} loading={false} error={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Provenance is available/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <TestWrapper>
        <EntityDetailView entity={null} loading={false} error={new Error('Failed to load')} />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    render(
      <TestWrapper>
        <EntityDetailView entity={null} loading={false} error={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Entity not found/i)).toBeInTheDocument();
  });

  it('handles missing type and mentionCount', () => {
    const sparseEntity = {
      ...mockEntity,
      type: '',
      mentionCount: null,
      mentions: [],
    };
    render(
      <TestWrapper>
        <EntityDetailView entity={sparseEntity as any} loading={false} error={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Type: unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/Mentions: 0/i)).toBeInTheDocument();
  });
});
