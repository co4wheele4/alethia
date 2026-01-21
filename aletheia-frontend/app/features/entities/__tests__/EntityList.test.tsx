import { render, screen, fireEvent } from '@testing-library/react';
import { EntityList } from '../components/EntityList';
import { useEntities } from '../hooks/useEntities';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../hooks/useEntities');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockEntities = [
  { id: 'e1', name: 'Entity One', type: 'Person', mentionCount: 5 },
  { id: 'e2', name: 'Entity Two', type: 'Location', mentionCount: 3 },
  { id: 'e3', name: 'Entity Three', type: 'Person', mentionCount: 1 },
];

describe('EntityList', () => {
  it('renders loading state', () => {
    (useEntities as any).mockReturnValue({
      entities: [],
      loading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading extracted entities/i)).toBeInTheDocument();
  });

  it('renders entities grouped by type', () => {
    (useEntities as any).mockReturnValue({
      entities: mockEntities,
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    expect(screen.getByText('Person (2)')).toBeInTheDocument();
    expect(screen.getByText('Location (1)')).toBeInTheDocument();
    expect(screen.getByText('Entity One')).toBeInTheDocument();
    expect(screen.getByText('Entity Two')).toBeInTheDocument();
  });

  it('filters entities by search query', () => {
    (useEntities as any).mockReturnValue({
      entities: mockEntities,
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    const searchInput = screen.getByLabelText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Two' } });

    expect(screen.queryByText('Entity One')).not.toBeInTheDocument();
    expect(screen.getByText('Entity Two')).toBeInTheDocument();
  });

  it('filters entities by type chip', () => {
    (useEntities as any).mockReturnValue({
      entities: mockEntities,
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    const personChip = screen.getByRole('button', { name: 'Person' });
    fireEvent.click(personChip);

    expect(screen.getByText('Entity One')).toBeInTheDocument();
    expect(screen.queryByText('Entity Two')).not.toBeInTheDocument();

    // Click same chip again to toggle off
    fireEvent.click(personChip);
    expect(screen.getByText('Entity Two')).toBeInTheDocument();

    const allTypesChip = screen.getByRole('button', { name: /All types/i });
    fireEvent.click(allTypesChip);
    expect(screen.getByText('Entity Two')).toBeInTheDocument();
  });

  it('renders unknown type and handles missing mention count', () => {
    (useEntities as any).mockReturnValue({
      entities: [{ id: 'e4', name: 'Unknown Entity', type: '', mentionCount: undefined }],
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    expect(screen.getByText(/unknown \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: unknown • Mentions: 0/i)).toBeInTheDocument();
  });

  it('shows info when no entities match filters', () => {
    (useEntities as any).mockReturnValue({
      entities: mockEntities,
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    const searchInput = screen.getByLabelText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

    expect(screen.getByText(/No entities match your filters/i)).toBeInTheDocument();
  });

  it('handles load more button', () => {
    const manyEntities = Array.from({ length: 60 }, (_, i) => ({
      id: `e${i}`,
      name: `Entity ${i}`,
      type: 'Person',
      mentionCount: 1,
    }));

    (useEntities as any).mockReturnValue({
      entities: manyEntities,
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    const loadMoreBtn = screen.getByRole('button', { name: /Load more/i });
    fireEvent.click(loadMoreBtn);
    expect(screen.getByText('Entity 55')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useEntities as any).mockReturnValue({
      entities: [],
      loading: false,
      error: { message: 'Failed to fetch' },
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useEntities as any).mockReturnValue({
      entities: [],
      loading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <EntityList />
      </TestWrapper>
    );

    expect(screen.getByText(/No entities yet/i)).toBeInTheDocument();
  });
});
