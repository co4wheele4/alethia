/**
 * EvidenceTextWithEntityHighlights
 *
 * Renders immutable evidence text with subtle, best-effort entity highlighting.
 *
 * IMPORTANT:
 * - This component highlights by literal entity name matches only (best-effort).
 * - Even when exact mention spans exist in the backend, this component does not use them.
 * - It must never imply that highlights are authoritative provenance.
 */
'use client';

import { useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

export type HighlightableEntity = {
  id: string;
  name: string;
  type: string;
  mentionCount: number;
  /**
   * If not provided by API, pass null/undefined and UI will show "unknown".
   */
  confidence?: number | null;
};

type Match = {
  start: number;
  end: number;
  entity: HighlightableEntity;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function computeNonOverlappingMatches(text: string, entities: HighlightableEntity[]): Match[] {
  const matches: Match[] = [];

  for (const e of entities) {
    const name = (e.name ?? '').trim();
    if (!name) continue;
    // Avoid pathological highlighting for 1-char entity names.
    if (name.length < 2) continue;

    const re = new RegExp(escapeRegExp(name), 'gi');
    for (const m of text.matchAll(re)) {
      const idx = m.index ?? -1;
      const len = m[0]?.length ?? 0;
      if (idx >= 0 && len > 0) {
        matches.push({ start: idx, end: idx + len, entity: e });
      }
    }
  }

  // Prefer earliest matches; break ties by longer spans (reduces partial overlaps).
  matches.sort((a, b) => (a.start - b.start) || (b.end - b.start - (a.end - a.start)));

  const accepted: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue; // overlap
    accepted.push(m);
    cursor = m.end;
  }
  return accepted;
}

export function EvidenceTextWithEntityHighlights(props: {
  text: string;
  entities: HighlightableEntity[];
  onEntityClick?: (entityId: string) => void;
}) {
  const { text, entities, onEntityClick } = props;

  const segments = useMemo(() => {
    if (!text) return [{ kind: 'text' as const, value: '' }];
    if (!entities.length) return [{ kind: 'text' as const, value: text }];

    const matches = computeNonOverlappingMatches(text, entities);
    if (matches.length === 0) return [{ kind: 'text' as const, value: text }];

    const out: Array<
      | { kind: 'text'; value: string }
      | { kind: 'entity'; value: string; entity: HighlightableEntity }
    > = [];

    let last = 0;
    for (const m of matches) {
      if (m.start > last) out.push({ kind: 'text', value: text.slice(last, m.start) });
      out.push({ kind: 'entity', value: text.slice(m.start, m.end), entity: m.entity });
      last = m.end;
    }
    if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
    return out;
  }, [text, entities]);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Entity highlights are literal name matches only (best-effort). Treat them as navigation aids, not evidence.
      </Typography>

      <Typography
        component="pre"
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-geist-mono)',
          bgcolor: 'action.hover',
          p: 1.5,
          borderRadius: 1,
          mb: 0,
          lineHeight: 1.6,
        }}
      >
        {segments.map((seg, i) => {
          if (seg.kind !== 'entity') return <Typography key={i} component="span">{seg.value}</Typography>;

          const e = seg.entity;
          const confidenceLabel =
            typeof e.confidence === 'number' ? `${Math.round(e.confidence * 100)}%` : 'unknown';

          return (
            <Tooltip
              key={i}
              placement="top"
              arrow
              title={
                <Box sx={{ display: 'grid', gap: 0.25 }}>
                  <Box>Entity: {e.name}</Box>
                  <Box>Type: {e.type || 'unknown'}</Box>
                  <Box>Confidence: {confidenceLabel}</Box>
                  <Box>Mentions (in this document): {e.mentionCount}</Box>
                </Box>
              }
            >
              <Box
                component="span"
                onClick={() => onEntityClick?.(e.id)}
                sx={{
                  cursor: onEntityClick ? 'pointer' : 'default',
                  backgroundColor: 'rgba(25, 118, 210, 0.10)',
                  borderBottom: '1px solid rgba(25, 118, 210, 0.35)',
                }}
              >
                {seg.value}
              </Box>
            </Tooltip>
          );
        })}
      </Typography>
    </Box>
  );
}

