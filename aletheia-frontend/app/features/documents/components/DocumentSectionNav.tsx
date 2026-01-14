'use client';

import { Box, Button, Typography } from '@mui/material';

import type { DocumentChunkItem } from '../hooks/useDocumentChunks';

export interface DocumentSectionNavProps {
  chunks: DocumentChunkItem[];
  selectedChunkIndex: number | null;
  onSelectChunkIndex: (chunkIndex: number) => void;
}

export function DocumentSectionNav(props: DocumentSectionNavProps) {
  const { chunks, selectedChunkIndex, onSelectChunkIndex } = props;
  const sorted = chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Sections (chunks)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {sorted.map((c) => (
          <Button
            key={c.id}
            size="small"
            variant={selectedChunkIndex === c.chunkIndex ? 'contained' : 'outlined'}
            sx={{ textTransform: 'none' }}
            onClick={() => onSelectChunkIndex(c.chunkIndex)}
          >
            {c.chunkIndex}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

