'use client';

import { Box, Button, Divider, Typography } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

import type { DocumentChunkItem, DocumentHeader } from '../../documents/hooks/useDocumentChunks';
import { EvidenceHighlightLayer } from './EvidenceHighlightLayer';

export interface EvidenceComparisonViewProps {
  document: DocumentHeader | null;
  left: DocumentChunkItem | null;
  right: DocumentChunkItem | null;
  query?: string;
}

export function EvidenceComparisonView(props: EvidenceComparisonViewProps) {
  const { document, left, right, query } = props;

  const copyCitation = async (chunkIndex: number) => {
    const citation = `Document ${document?.id ?? ''}, chunk ${chunkIndex}`;
    try {
      await navigator.clipboard.writeText(citation);
    } catch {
      window.prompt('Copy citation:', citation);
    }
  };

  if (!left && !right) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          Select two chunks to compare side-by-side.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Side-by-side comparison
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Comparison does not imply conflict or agreement; it only shows two immutable excerpts together.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {[{ side: 'A', chunk: left }, { side: 'B', chunk: right }].map(({ side, chunk }) => (
          <Box
            key={side}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {side} • Chunk {chunk?.chunkIndex ?? '—'}
              </Typography>
              {chunk ? (
                <Button
                  size="small"
                  variant="text"
                  sx={{ textTransform: 'none' }}
                  onClick={() => void copyCitation(chunk.chunkIndex)}
                >
                  Copy citation
                </Button>
              ) : null}
            </Box>

            {chunk ? <EvidenceHighlightLayer text={chunk.content} query={query} /> : <Typography variant="body2">—</Typography>}
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />
    </Box>
  );
}

