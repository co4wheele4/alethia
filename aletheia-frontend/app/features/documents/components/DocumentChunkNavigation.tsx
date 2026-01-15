/**
 * DocumentChunkNavigation
 *
 * Left-side chunk/outline navigation for the Document Viewer.
 */
'use client';

import { Box, Button, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import type { DocumentChunkItem } from '../hooks/useDocumentChunks';

export function DocumentChunkNavigation(props: {
  chunks: DocumentChunkItem[];
  selectedChunkIndex: number | null;
  onSelectChunkIndex: (chunkIndex: number) => void;
}) {
  const { chunks, selectedChunkIndex, onSelectChunkIndex } = props;

  const sorted = chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex);
  const [visibleCount, setVisibleCount] = useState(40);
  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const canLoadMore = sorted.length > visible.length;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" gutterBottom>
        Chunks
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Chunked evidence text (immutable). Select a chunk to inspect.
      </Typography>

      <List dense aria-label="document-chunk-navigation" sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        {visible.map((c) => (
          <ListItemButton
            key={c.id}
            selected={selectedChunkIndex === c.chunkIndex}
            onClick={() => onSelectChunkIndex(c.chunkIndex)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText
              primary={`Chunk ${c.chunkIndex}`}
              secondary={`${c.mentions?.length ?? 0} mentions`}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        ))}
      </List>

      {canLoadMore ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleCount((v) => v + 40)}>
            Load more chunks
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

