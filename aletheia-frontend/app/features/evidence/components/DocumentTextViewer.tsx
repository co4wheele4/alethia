'use client';

import { useMemo } from 'react';
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
}) {
  const { document, activeEntityId, rangesByChunkId } = props;

  const chunks = useMemo(() => {
    return (document?.chunks ?? []).slice().sort(sortByChunkIndex);
  }, [document?.chunks]);

  if (!document) {
    return <Alert severity="info">Select a document to view its chunk text and evidence highlights.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
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

