'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Alert, Box, Typography } from '@mui/material';

import type { EvidenceDocument } from '../hooks/useDocumentEvidence';
import type { HighlightRange } from '../hooks/useEntityMentions';
import { MentionHighlightOverlay } from './MentionHighlightOverlay';

function sortByChunkIndex(a: { chunkIndex: number }, b: { chunkIndex: number }) {
  return a.chunkIndex - b.chunkIndex;
}

export function DocumentTextViewer(props: {
  document: EvidenceDocument | null;
  activeEntityId: string | null;
  rangesByChunkId: Record<string, HighlightRange[]>;
  /**
   * If provided, scroll to the first rendered segment covered by this mentionId.
   * If not found (e.g. legacy / filtered), falls back to first evidence segment.
   */
  scrollToMentionId?: string | null;
  /**
   * If true, scroll to the first highlighted segment when highlights exist.
   */
  autoScrollToFirstEvidence?: boolean;
}) {
  const { document, activeEntityId, rangesByChunkId, scrollToMentionId, autoScrollToFirstEvidence } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const didAutoScrollRef = useRef(false);

  const chunks = useMemo(() => {
    return (document?.chunks ?? []).slice().sort(sortByChunkIndex);
  }, [document?.chunks]);

  useEffect(() => {
    // Evidence inspection is read-only; scrolling is the only allowed "action".
    // We only auto-scroll once per document render unless an explicit mentionId is provided.
    const root = rootRef.current;
    if (!root) return;
    if (!document) return;

    const marks = Array.from(root.querySelectorAll('mark[data-mentions]')) as HTMLElement[];
    if (marks.length === 0) return;

    const scrollTo = (el: HTMLElement) => {
      try {
        el.scrollIntoView({ block: 'center' });
      } catch {
        // jsdom / older browsers: ignore
        el.scrollIntoView();
      }
    };

    if (scrollToMentionId) {
      const hit = marks.find((m) => {
        const raw = m.getAttribute('data-mentions') ?? '';
        return raw.split(',').includes(scrollToMentionId);
      });
      scrollTo(hit ?? marks[0]!);
      return;
    }

    if (autoScrollToFirstEvidence && !didAutoScrollRef.current) {
      didAutoScrollRef.current = true;
      scrollTo(marks[0]!);
    }
  }, [autoScrollToFirstEvidence, scrollToMentionId, document, document?.id]);

  if (!document) {
    return <Alert severity="info">Select a document to view its chunk text and evidence highlights.</Alert>;
  }

  return (
    <Box ref={rootRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Document text
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Highlights are strict, offset-based mentions. {activeEntityId ? 'Only the selected entity is highlighted.' : 'Select an entity to highlight its spans.'}
        </Typography>
      </Box>

      {chunks.map((c) => {
        const ranges = activeEntityId ? (rangesByChunkId[c.id] ?? []) : [];
        return (
          <Box key={c.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Chunk {c.chunkIndex} • {c.id}
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', lineHeight: 1.7 }}
              data-testid={`truth-chunk-text-${c.chunkIndex}`}
            >
              <MentionHighlightOverlay text={c.content} ranges={ranges} />
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

