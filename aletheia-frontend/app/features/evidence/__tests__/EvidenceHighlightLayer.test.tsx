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
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" query="missing" />
      </TestWrapper>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(container.querySelector('mark')).toBeNull();
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

  it('sorts same-start ranges by end and skips overlaps deterministically', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer
          text="Hello"
          // Same start, different ends (forces comparator second operand) + overlap skip.
          ranges={[{ start: 0, end: 2 }, { start: 0, end: 1 }]}
        />
      </TestWrapper>
    );

    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(1);
    // Sorted by end ascending -> first highlight is "H", second would overlap and is skipped.
    expect(marks[0]).toHaveTextContent('H');
  });

  it('renders a leading text segment when a range starts after cursor', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceHighlightLayer text="Hello world" ranges={[{ start: 6, end: 11 }]} />
      </TestWrapper>
    );

    const pre = container.querySelector('pre') as HTMLElement | null;
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toBe('Hello world');

    // Ensure the first chunk is un-highlighted text, then a mark.
    const nodes = Array.from(pre?.childNodes ?? []);
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    expect(nodes[0].textContent).toBe('Hello ');
    expect((nodes[1] as HTMLElement).tagName).toBe('MARK');
    expect(nodes[1].textContent).toBe('world');
  });

  it('falls back to plain text when highlight parts cannot be constructed (defensive)', () => {
    const originalPush = Array.prototype.push;
    const isHighlightPart = (x: unknown): x is { kind: 'text' | 'hit'; value: string } => {
      if (!x || typeof x !== 'object') return false;
      if (!('kind' in x) || !('value' in x)) return false;
      const kind = (x as { kind: unknown }).kind;
      const value = (x as { value: unknown }).value;
      return (kind === 'text' || kind === 'hit') && typeof value === 'string';
    };

    // Vitest's spy infrastructure uses Array.prototype.push internally, so we can't spy on it safely.
    // Instead, temporarily override push to no-op only for the internal `{ kind, value }` parts.
    Object.defineProperty(Array.prototype, 'push', {
      configurable: true,
      writable: true,
      value: function (this: unknown[], ...args: unknown[]) {
        if (args.length === 1 && isHighlightPart(args[0])) {
          return this.length;
        }
        return originalPush.apply(this, args as never);
      },
    });

    try {
      const { container } = render(
        <TestWrapper>
          <EvidenceHighlightLayer text="Hello" ranges={[{ start: 0, end: 1 }]} />
        </TestWrapper>
      );

      // Still shows the highlighting help text because ranges were provided.
      expect(screen.getByText(/Highlighting is literal/i)).toBeInTheDocument();

      // But because pushes were suppressed, it must fall back to a single plain-text part.
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(container.querySelector('mark')).toBeNull();
    } finally {
      Object.defineProperty(Array.prototype, 'push', {
        configurable: true,
        writable: true,
        value: originalPush,
      });
    }
  });
});
