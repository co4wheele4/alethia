import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '../../../hooks/useTheme';
import { MentionHighlightOverlay } from '../components/MentionHighlightOverlay';

describe('MentionHighlightOverlay', () => {
  it('renders non-overlapping mention marks with stable test ids', () => {
    render(
      <ThemeProvider>
        <MentionHighlightOverlay
          text="abcdef"
          ranges={[
            { mentionId: 'm1', start: 1, end: 3 }, // "bc"
            { mentionId: 'm2', start: 4, end: 6 }, // "ef"
          ]}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mention-highlight-m1')).toHaveTextContent('bc');
    expect(screen.getByTestId('mention-highlight-m2')).toHaveTextContent('ef');
  });

  it('handles overlapping spans safely by segmenting and annotating coverage', () => {
    const { container } = render(
      <ThemeProvider>
        <MentionHighlightOverlay
          text="abcdef"
          ranges={[
            { mentionId: 'm1', start: 1, end: 4 }, // "bcd"
            { mentionId: 'm2', start: 3, end: 5 }, // "de"
          ]}
        />
      </ThemeProvider>
    );

    // There must exist a segment covered by both m1 and m2 (overlap on "d").
    const overlap = container.querySelector('mark[data-mentions="m1,m2"]');
    expect(overlap).not.toBeNull();
    expect(overlap).toHaveTextContent('d');
  });

  it('throws on invalid offsets (out of bounds)', () => {
    expect(() =>
      render(
        <ThemeProvider>
          <MentionHighlightOverlay text="abc" ranges={[{ mentionId: 'm1', start: 0, end: 10 }]} />
        </ThemeProvider>
      )
    ).toThrow(/Invalid mention range/i);
  });
});

