'use client';

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export type MentionRange = {
  mentionId: string;
  start: number;
  end: number;
};

function fail(message: string): never {
  throw new Error(`[Truth Surface] ${message}`);
}

function assertValidRanges(text: string, ranges: MentionRange[]) {
  for (const r of ranges) {
    if (!Number.isFinite(r.start) || !Number.isFinite(r.end)) {
      fail(`Invalid mention range for ${r.mentionId}: non-numeric offsets`);
    }
    if (r.start < 0 || r.end <= r.start) {
      fail(`Invalid mention range for ${r.mentionId}: [${r.start}, ${r.end})`);
    }
    if (r.end > text.length) {
      fail(`Invalid mention range for ${r.mentionId}: end=${r.end} > text.length=${text.length}`);
    }
  }
}

export function MentionHighlightOverlay(props: {
  text: string;
  ranges?: MentionRange[] | null;
  /**
   * Optional CSS color tuning hook for tests/variants.
   */
  highlightSx?: Record<string, unknown>;
}) {
  const { text, ranges, highlightSx } = props;
  const safeText = text ?? '';
  const rs = (ranges ?? []).slice();

  if (rs.length === 0) return <>{safeText}</>;
  assertValidRanges(safeText, rs);

  // Overlapping spans can occur in real data. Evidence inspection must remain usable:
  // we render a deterministic, non-destructive overlay by splitting the text into
  // boundary-aligned segments and marking any segment covered by one-or-more mentions.
  const boundaries = new Set<number>([0, safeText.length]);
  for (const r of rs) {
    boundaries.add(r.start);
    boundaries.add(r.end);
  }
  const points = [...boundaries].sort((a, b) => a - b);

  const out: React.ReactNode[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i]!;
    const end = points[i + 1]!;
    if (start === end) continue;

    const covering = rs
      .filter((r) => r.start <= start && r.end >= end)
      .map((r) => r.mentionId)
      .slice()
      .sort();

    const segmentText = safeText.slice(start, end);
    if (covering.length === 0) {
      out.push(segmentText);
      continue;
    }

    const single = covering.length === 1 ? covering[0]! : null;

    out.push(
      <Box
        key={`${start}:${end}:${covering.join(',')}`}
        component="mark"
        data-start={String(start)}
        data-end={String(end)}
        data-mentions={covering.join(',')}
        data-testid={single ? `mention-highlight-${single}` : undefined}
        // `mark` has strong user-agent defaults (yellow bg, black text).
        // Force inherited text color so highlights never reduce contrast.
        style={{ color: 'inherit' }}
        sx={{
          px: 0.25,
          borderRadius: 0.5,
          bgcolor: (theme) => {
            const base = covering.length > 1 ? theme.palette.secondary.main : theme.palette.info.main;
            const a = theme.palette.mode === 'dark' ? 0.32 : 0.14;
            return alpha(base, a);
          },
          borderBottom: (theme) => {
            const base = covering.length > 1 ? theme.palette.secondary.main : theme.palette.info.main;
            const a = theme.palette.mode === 'dark' ? 0.85 : 0.55;
            return `1px solid ${alpha(base, a)}`;
          },
          color: 'inherit',
          ...highlightSx,
        }}
      >
        {segmentText}
      </Box>
    );
  }

  return <>{out}</>;
}

