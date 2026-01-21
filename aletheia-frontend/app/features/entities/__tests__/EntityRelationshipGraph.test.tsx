import { render, screen } from '@testing-library/react';
import { EntityRelationshipGraph } from '../components/EntityRelationshipGraph';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockEntity = {
  id: 'e1',
  name: 'Subject',
  type: 'Person',
  outgoing: [
    {
      id: 'r1',
      relation: 'WORKS_AT',
      to: { id: 'e2', name: 'Company', type: 'Organization' },
    },
  ],
  incoming: [
    {
      id: 'r2',
      relation: 'KNOWS',
      from: { id: 'e3', name: 'Friend', type: 'Person' },
    },
  ],
};

describe('EntityRelationshipGraph', () => {
  it('renders relationships correctly', () => {
    render(
      <TestWrapper>
        <EntityRelationshipGraph entity={mockEntity as any} />
      </TestWrapper>
    );

    expect(screen.getByText(/WORKS_AT → Company/i)).toBeInTheDocument();
    expect(screen.getByText(/Friend → KNOWS/i)).toBeInTheDocument();
  });

  it('handles missing outgoing and incoming arrays', () => {
    render(
      <TestWrapper>
        <EntityRelationshipGraph
          entity={{ id: 'e1', name: 'Lone', type: 'Person' } as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No outgoing relationships/i)).toBeInTheDocument();
    expect(screen.getByText(/No incoming relationships/i)).toBeInTheDocument();
  });

  it('renders empty state message when no relationships', () => {
    render(
      <TestWrapper>
        <EntityRelationshipGraph
          entity={{ id: 'e1', name: 'Lone', type: 'Person', outgoing: [], incoming: [] } as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No outgoing relationships/i)).toBeInTheDocument();
    expect(screen.getByText(/No incoming relationships/i)).toBeInTheDocument();
  });
});
