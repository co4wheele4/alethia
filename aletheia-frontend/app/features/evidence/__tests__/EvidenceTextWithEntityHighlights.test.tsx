import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceTextWithEntityHighlights } from '../components/EvidenceTextWithEntityHighlights';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockEntities = [
  { id: 'e1', name: 'John Doe', type: 'Person', mentionCount: 1, confidence: 0.95 },
  { id: 'e2', name: 'ACME Corp', type: 'Organization', mentionCount: 2, confidence: null },
];

describe('EvidenceTextWithEntityHighlights', () => {
  it('renders text with entity highlights', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="John Doe works at ACME Corp."
          entities={mockEntities as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    expect(screen.getByText(/works at/i)).toBeInTheDocument();
  });

  it('handles entity click', () => {
    const onEntityClick = vi.fn();
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="Hello John Doe"
          entities={mockEntities as any}
          onEntityClick={onEntityClick}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('John Doe'));
    expect(onEntityClick).toHaveBeenCalledWith('e1');
  });

  it('renders plain text if no entities match', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="Plain text"
          entities={mockEntities as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Plain text')).toBeInTheDocument();
  });

  it('handles empty text', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text=""
          entities={mockEntities as any}
        />
      </TestWrapper>
    );

    // No content to assert, just checking it doesn't crash
  });

  it('handles entities with missing name or short name', () => {
    const invalidEntities = [
      { id: 'e3', name: '', type: 'Person', mentionCount: 1 },
      { id: 'e4', name: 'A', type: 'Person', mentionCount: 1 },
      { id: 'e5', name: 'Valid', type: '', mentionCount: 1 },
    ];
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="A is for Apple. Valid entity here."
          entities={invalidEntities as any}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText(/A is for Apple/i)).toBeInTheDocument();
    // It should NOT have the highlight background.
    expect(screen.getByText(/A is for Apple/i)).not.toHaveStyle('backgroundColor: rgba(25, 118, 210, 0.10)');
  });

  it('handles empty entities list', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="Some text"
          entities={[]}
        />
      </TestWrapper>
    );
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });

  it('handles overlapping entities by prioritizing earlier/longer', () => {
    const overlapping = [
      { id: 'e1', name: 'John Doe', type: 'Person', mentionCount: 1 },
      { id: 'e2', name: 'John', type: 'Person', mentionCount: 1 },
    ];
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="John Doe is here."
          entities={overlapping as any}
        />
      </TestWrapper>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('John')).not.toBeInTheDocument(); // because John Doe matched
  });

  it('handles entities with null name', () => {
    const nullEntities = [
      { id: 'e6', name: null, type: 'Person', mentionCount: 1 },
    ];
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights
          text="Some text"
          entities={nullEntities as any}
        />
      </TestWrapper>
    );
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });
});
