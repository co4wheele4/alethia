'use client';

import { useMemo } from 'react';
import { Alert, Box, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

type Mention = {
  __typename?: 'EntityMention';
  id: string;
  entityId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
  entity: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
};

type Chunk = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  content: string;
  mentions: Mention[];
};

type Span = {
  mentionId: string;
  entityId: string;
  label: string;
  start: number;
  end: number;
};

function computeRenderableSpans(content: string, mentions: Mention[]) {
  const issues: string[] = [];

  const spans: Span[] = [];
  for (const m of mentions ?? []) {
    const start = m.startOffset;
    const end = m.endOffset;
    if (typeof start !== 'number' || typeof end !== 'number') {
      issues.push(`Mention ${m.id} has missing offsets`);
      continue;
    }
    if (start < 0 || end <= start || end > content.length) {
      issues.push(`Mention ${m.id} has invalid offsets [${start}, ${end})`);
      continue;
    }

    // If excerpt is present and disagrees with the offset slice, prefer excerpt-length
    // when it matches the content at the same start offset. This prevents common
    // off-by-one endOffset issues from rendering misleading highlights.
    let fixedEnd = end;
    const excerpt = m.excerpt ?? null;
    const entityName = (m.entity?.name ?? '').trim() || null;
    const expected = excerpt ?? entityName;

    // Only attempt to shorten spans; never expand beyond the backend-provided endOffset.
    if (expected && expected !== content.slice(start, end)) {
      const candidateEnd = start + expected.length;
      if (candidateEnd > start && candidateEnd <= end && content.slice(start, candidateEnd) === expected) {
        issues.push(`Mention ${m.id} text mismatch; rendering highlight using expected text length`);
        fixedEnd = candidateEnd;
      } else if (excerpt) {
        // Excerpt exists but isn't alignable at start; keep offsets and warn.
        issues.push(`Mention ${m.id} excerpt mismatch; rendering highlight using offsets`);
      }
    }

    spans.push({
      mentionId: m.id,
      entityId: m.entityId,
      label: m.entity?.name ?? m.entityId,
      start,
      end: fixedEnd,
    });
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);

  const accepted: Span[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start < cursor) {
      issues.push(`Overlapping mention span skipped: ${s.mentionId}`);
      continue;
    }
    accepted.push(s);
    cursor = s.end;
  }

  return { spans: accepted, issues };
}

function renderHighlightedText(content: string, spans: Span[], activeEntityId?: string | null, onEntityClick?: (entityId: string) => void) {
  if (!spans.length) return content;

  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (cursor < s.start) out.push(content.slice(cursor, s.start));

    const isActive = Boolean(activeEntityId && s.entityId === activeEntityId);

    out.push(
      <Box
        key={s.mentionId}
        component="mark"
        onClick={() => onEntityClick?.(s.entityId)}
        title={`${s.label} [${s.start}, ${s.end})`}
        // `mark` has strong user-agent defaults (yellow bg, black text).
        // Force inherited text color so highlights never reduce contrast.
        style={{ color: 'inherit' }}
        sx={{
          px: 0.25,
          borderRadius: 0.5,
          cursor: onEntityClick ? 'pointer' : 'default',
          bgcolor: (theme) => {
            const base = isActive ? theme.palette.secondary.main : theme.palette.info.main;
            const a = theme.palette.mode === 'dark' ? (isActive ? 0.38 : 0.32) : (isActive ? 0.18 : 0.14);
            return alpha(base, a);
          },
          borderBottom: (theme) => {
            const base = isActive ? theme.palette.secondary.main : theme.palette.info.main;
            const a = theme.palette.mode === 'dark' ? 0.9 : 0.55;
            const w = isActive ? 2 : 1;
            return `${w}px solid ${alpha(base, a)}`;
          },
          color: 'inherit',
        }}
      >
        {content.slice(s.start, s.end)}
      </Box>
    );
    cursor = s.end;
  }
  if (cursor < content.length) out.push(content.slice(cursor));
  return out;
}

export function DocumentTextWithMentions(props: {
  chunks: Chunk[];
  activeEntityId?: string | null;
  onEntityClick?: (entityId: string) => void;
}) {
  const { chunks, activeEntityId, onEntityClick } = props;

  const sorted = useMemo(() => chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex), [chunks]);

  if (sorted.length === 0) {
    return <Alert severity="info">No document text is available (no chunks returned).</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <Typography variant="subtitle2">Document text (chunked)</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Highlights are rendered strictly from mention offsets (\(startOffset\), \(endOffset\)). If offsets cannot be applied,
        the raw text is shown with a warning.
      </Typography>

      <Divider />

      {sorted.map((c) => {
        const content = c.content ?? '';
        const { spans, issues } = computeRenderableSpans(content, c.mentions ?? []);

        return (
          <Box key={c.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Chunk {c.chunkIndex} • {c.mentions?.length ?? 0} mention(s)
            </Typography>

            {issues.length > 0 ? (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Some mention offsets could not be rendered for this chunk. Showing the raw text with whatever spans were valid.
              </Alert>
            ) : null}

            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.7 }}
              data-testid={`chunk-text-${c.chunkIndex}`}
            >
              {renderHighlightedText(content, spans, activeEntityId, onEntityClick)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

