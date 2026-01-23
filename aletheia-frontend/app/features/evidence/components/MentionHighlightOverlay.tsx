'use client';

import { Box } from '@mui/material';

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

  const sorted = ranges.slice().sort((a, b) => a.start - b.start || b.end - a.end);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.start < prev.end) {
      fail(`Overlapping mention ranges are not allowed (chunk spans overlap: ${prev.mentionId} overlaps ${cur.mentionId})`);
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

  const sorted = rs.slice().sort((a, b) => a.start - b.start || b.end - a.end);

  const out: React.ReactNode[] = [];
  let cursor = 0;

  for (const r of sorted) {
    if (cursor < r.start) out.push(safeText.slice(cursor, r.start));

    out.push(
      <Box
        key={r.mentionId}
        component="mark"
        data-testid={`mention-highlight-${r.mentionId}`}
        data-start={String(r.start)}
        data-end={String(r.end)}
        sx={{
          px: 0.25,
          borderRadius: 0.5,
          bgcolor: 'rgba(25, 118, 210, 0.14)',
          borderBottom: '1px solid rgba(25, 118, 210, 0.55)',
          ...highlightSx,
        }}
      >
        {safeText.slice(r.start, r.end)}
      </Box>
    );

    cursor = r.end;
  }

  if (cursor < safeText.length) out.push(safeText.slice(cursor));
  return <>{out}</>;
}

