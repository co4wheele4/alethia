'use client';

import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';

import { MentionHighlightOverlay } from '../../evidence/components/MentionHighlightOverlay';

function fail(message: string): never {
  throw new Error(`[ClaimComparison] ${message}`);
}

function windowByOffsets(args: { text: string; start: number; end: number; contextChars?: number }) {
  const { text, start, end, contextChars = 80 } = args;
  if (!Number.isFinite(start) || !Number.isFinite(end)) fail(`Non-numeric offsets [${String(start)}, ${String(end)})`);
  if (start < 0 || end <= start) fail(`Invalid offsets [${start}, ${end})`);
  if (end > text.length) fail(`Invalid offsets: end=${end} > text.length=${text.length}`);

  const s = Math.max(0, start - contextChars);
  const e = Math.min(text.length, end + contextChars);
  return {
    windowText: text.slice(s, e),
    windowStartOffset: s,
    startInWindow: start - s,
    endInWindow: end - s,
    clippedStart: s > 0,
    clippedEnd: e < text.length,
  };
}

export type ClaimEvidenceSnippetModel =
  | {
      kind: 'mention';
      evidenceId: string;
      documentId: string;
      documentTitle: string;
      chunkIndex: number;
      chunkText: string;
      startOffset: number;
      endOffset: number;
      mentionId: string;
      entityLabel?: string | null;
    }
  | {
      kind: 'relationship';
      evidenceId: string;
      relationshipId: string;
      anchorId: string;
      documentId: string;
      documentTitle: string;
      chunkIndex: number;
      chunkText: string;
      startOffset: number;
      endOffset: number;
    };

export function ClaimEvidenceSnippet(props: { item: ClaimEvidenceSnippetModel }) {
  const { item } = props;
  const { windowText, startInWindow, endInWindow, clippedStart, clippedEnd } = windowByOffsets({
    text: item.chunkText ?? '',
    start: item.startOffset,
    end: item.endOffset,
  });

  const jumpHref =
    item.kind === 'mention'
      ? `/documents?documentId=${encodeURIComponent(item.documentId)}&chunk=${encodeURIComponent(
          String(item.chunkIndex)
        )}&mentionId=${encodeURIComponent(item.mentionId)}`
      : `/documents/${encodeURIComponent(item.documentId)}`;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, minWidth: 0 }} data-testid="claim-evidence-snippet">
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Source document:{' '}
            <Link href={`/documents/${encodeURIComponent(item.documentId)}`} style={{ textDecoration: 'none' }}>
              {item.documentTitle}
            </Link>{' '}
            • chunk {item.chunkIndex} • offsets {item.startOffset}–{item.endOffset}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {item.kind === 'mention'
              ? `Mention • mentionId=${item.mentionId}${item.entityLabel ? ` • entity=${item.entityLabel}` : ''}`
              : `Relationship • relationshipId=${item.relationshipId} • evidenceAnchorId=${item.anchorId}`}
          </Typography>
        </Box>
        <Button component={Link} href={jumpHref} size="small" sx={{ textTransform: 'none', flex: '0 0 auto' }}>
          Open source
        </Button>
      </Stack>

      <Typography
        variant="body2"
        component="div"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.7, mt: 1, minWidth: 0 }}
      >
        {clippedStart ? '…' : null}
        <MentionHighlightOverlay
          text={windowText}
          ranges={[{ mentionId: item.kind === 'mention' ? item.mentionId : item.anchorId, start: startInWindow, end: endInWindow }]}
        />
        {clippedEnd ? '…' : null}
      </Typography>

      {(clippedStart || clippedEnd) && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Snippet is context-windowed around offsets.
        </Typography>
      )}
    </Box>
  );
}

