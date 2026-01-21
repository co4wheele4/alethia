import { render, screen } from '@testing-library/react';
import { EvidenceHighlightLayer } from '../components/EvidenceHighlightLayer';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('EvidenceHighlightLayer', () => {
  it('renders text with query highlights', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" query="world" />
      </TestWrapper>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.getByText('world').tagName).toBe('MARK');
  });

  it('renders text with range highlights', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" ranges={[{ start: 0, end: 5 }]} />
      </TestWrapper>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hello').tagName).toBe('MARK');
    expect(screen.getByText(/world/)).toBeInTheDocument();
  });

  it('handles invalid ranges', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" ranges={[{ start: -5, end: 100 }]} />
      </TestWrapper>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Hello world').tagName).toBe('MARK');
  });

  it('handles overlapping ranges', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" ranges={[{ start: 0, end: 5 }, { start: 3, end: 8 }]} />
      </TestWrapper>
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(1);
    expect(marks[0]).toHaveTextContent('Hello');
  });

  it('renders as div when preformatted is false', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" preformatted={false} />
      </TestWrapper>
    );
    const textNode = screen.getByText('Hello world');
    expect(textNode.parentElement?.tagName).toBe('DIV');
  });

  it('handles query with no matches', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" query="missing" />
      </TestWrapper>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.queryByRole('mark')).not.toBeInTheDocument();
  });

  it('handles empty query', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" query="" />
      </TestWrapper>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('handles empty text', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer text="" query="abc" />
      </TestWrapper>
    );
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('escapes regex special characters', () => {
    render(
      <TestWrapper>
        <EvidenceHighlightLayer text="[a.b]*" query="[a.b]*" />
      </TestWrapper>
    );
    expect(screen.getByText('[a.b]*')).toBeInTheDocument();
    expect(screen.getByText('[a.b]*').tagName).toBe('MARK');
  });

  it('covers fallback return in validRanges branch', () => {
    // To trigger this branch, validRanges must have length but out must be empty.
    // This happens if all ranges are invalid or text is empty.
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer text="" ranges={[{start: 0, end: 10}]} />
      </TestWrapper>
    );
    expect(container.querySelector('pre')).toBeInTheDocument();
  });
});
