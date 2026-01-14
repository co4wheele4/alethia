'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Button, Divider, TextField, Typography } from '@mui/material';

import type { DocumentChunkItem } from '../hooks/useDocumentChunks';
import { EvidenceHighlightLayer } from '../../evidence/components/EvidenceHighlightLayer';
import { parseProvenanceFromChunk0 } from '../provenance';
import { DocumentSectionNav } from './DocumentSectionNav';

export interface DocumentViewerProps {
  chunks: DocumentChunkItem[];
}

export function DocumentViewer(props: DocumentViewerProps) {
  const { chunks } = props;
  const sorted = useMemo(() => chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex), [chunks]);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(sorted[0]?.chunkIndex ?? null);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => {
    if (selectedChunkIndex === null) return null;
    return sorted.find((c) => c.chunkIndex === selectedChunkIndex) ?? null;
  }, [sorted, selectedChunkIndex]);

  const chunk0 = sorted[0] ?? null;
  const parsed0 = useMemo(() => (chunk0 ? parseProvenanceFromChunk0(chunk0.content) : null), [chunk0]);

  const content = useMemo(() => {
    if (!selected) return '';
    if (selected.chunkIndex === 0 && parsed0?.rawHeader) {
      // Default: hide raw provenance header to keep viewer focused on the evidence body.
      return parsed0.body;
    }
    return selected.content;
  }, [selected, parsed0]);

  const copyCitation = async () => {
    const citation = `chunk ${selected?.chunkIndex ?? '—'}`;
    try {
      await navigator.clipboard.writeText(citation);
    } catch {
      window.prompt('Copy citation:', citation);
    }
  };

  if (sorted.length === 0) {
    return <Alert severity="info">No chunks available.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Document viewer (read-only)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The viewer shows immutable chunks. No inline edits or annotations are supported.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DocumentSectionNav
          chunks={sorted}
          selectedChunkIndex={selectedChunkIndex}
          onSelectChunkIndex={setSelectedChunkIndex}
        />

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <TextField
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            fullWidth
          />
          <Button variant="outlined" sx={{ textTransform: 'none' }} onClick={() => void copyCitation()}>
            Copy citation
          </Button>
        </Box>

        {selected ? <EvidenceHighlightLayer text={content} query={query} /> : null}
      </Box>
    </Box>
  );
}

