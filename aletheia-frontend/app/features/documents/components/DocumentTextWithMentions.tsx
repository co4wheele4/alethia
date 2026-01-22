'use client';

import { useMemo } from 'react';
import { Alert, Box, Divider, Typography } from '@mui/material';

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
    spans.push({
      mentionId: m.id,
      entityId: m.entityId,
      label: m.entity?.name ?? m.entityId,
      start,
      end,
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
        sx={{
          px: 0.25,
          borderRadius: 0.5,
          cursor: onEntityClick ? 'pointer' : 'default',
          bgcolor: isActive ? 'rgba(156, 39, 176, 0.18)' : 'rgba(25, 118, 210, 0.14)',
          borderBottom: isActive ? '2px solid rgba(156, 39, 176, 0.55)' : '1px solid rgba(25, 118, 210, 0.45)',
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

