'use client';

import { Alert, Box, Typography } from '@mui/material';

import { MentionHighlightOverlay } from '../../evidence/components/MentionHighlightOverlay';

export function MentionHighlight(props: {
  mentionId: string;
  chunkText: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
}) {
  const { mentionId, chunkText, startOffset, endOffset, excerpt } = props;

  const start = startOffset;
  const end = endOffset;

  const hasOffsets = typeof start === 'number' && typeof end === 'number';

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        mentionId={mentionId} • offsets {hasOffsets ? `${start}–${end}` : '—'}
      </Typography>

      {hasOffsets ? (
        <Typography
          variant="body2"
          component="div"
          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.7 }}
        >
          <MentionHighlightOverlay text={chunkText ?? ''} ranges={[{ mentionId, start, end }]} />
        </Typography>
      ) : (
        <>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Mention offsets are missing; rendering cannot highlight the span. Showing excerpt/raw text only.
          </Alert>
          <Typography
            variant="body2"
            component="div"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.7, mt: 1 }}
          >
            {excerpt ?? chunkText ?? ''}
          </Typography>
        </>
      )}
    </Box>
  );
}

