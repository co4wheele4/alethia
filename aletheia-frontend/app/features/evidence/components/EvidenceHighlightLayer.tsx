'use client';

import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

export interface EvidenceHighlightLayerProps {
  text: string;
  query?: string;
  /**
   * Exact span highlight(s) into the provided text.
   * Offsets are 0-based; end is exclusive.
   */
  ranges?: Array<{ start: number; end: number }>;
  /**
   * If true, renders as `<pre>` with monospace and wrapping.
   */
  preformatted?: boolean;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function EvidenceHighlightLayer(props: EvidenceHighlightLayerProps) {
  const { text, query, ranges, preformatted = true } = props;
  const q = (query ?? '').trim();

  const parts = useMemo(() => {
    const validRanges = (ranges ?? [])
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end))
      .map((r) => ({ start: Math.max(0, r.start), end: Math.min(text.length, r.end) }))
      .filter((r) => r.end > r.start)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    if (validRanges.length) {
      const out: Array<{ kind: 'text' | 'hit'; value: string }> = [];
      let cursor = 0;
      for (const r of validRanges) {
        if (r.start < cursor) continue; // avoid overlaps by skipping
        if (r.start > cursor) out.push({ kind: 'text', value: text.slice(cursor, r.start) });
        out.push({ kind: 'hit', value: text.slice(r.start, r.end) });
        cursor = r.end;
      }
      if (cursor < text.length) out.push({ kind: 'text', value: text.slice(cursor) });
      return out.length ? out : [{ kind: 'text' as const, value: text }];
    }

    if (!q) return [{ kind: 'text' as const, value: text }];
    const re = new RegExp(escapeRegExp(q), 'ig');
    const out: Array<{ kind: 'text' | 'hit'; value: string }> = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const idx = m.index ?? 0;
      if (idx > last) out.push({ kind: 'text', value: text.slice(last, idx) });
      out.push({ kind: 'hit', value: text.slice(idx, idx + (m[0]?.length ?? 0)) });
      last = idx + (m[0]?.length ?? 0);
    }
    if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
    return out.length ? out : [{ kind: 'text' as const, value: text }];
  }, [text, q, ranges]);

  return (
    <Box>
      {q || (ranges?.length ?? 0) > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Highlighting is literal: exact spans (when provided) or literal text match.
        </Typography>
      ) : null}

      <Typography
        component={preformatted ? 'pre' : 'div'}
        variant="body2"
        sx={{
          whiteSpace: preformatted ? 'pre-wrap' : 'normal',
          fontFamily: preformatted ? 'var(--font-geist-mono)' : 'inherit',
          bgcolor: 'action.hover',
          p: 1.5,
          borderRadius: 1,
          mb: 0,
        }}
      >
        {parts.map((p, i) =>
          p.kind === 'hit' ? (
            <mark key={i} style={{ backgroundColor: 'rgba(255, 214, 10, 0.35)', padding: 0 }}>
              {p.value}
            </mark>
          ) : (
            <Typography key={i} component="span">{p.value}</Typography>
          )
        )}
      </Typography>
    </Box>
  );
}

