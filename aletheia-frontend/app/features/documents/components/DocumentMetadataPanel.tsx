'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks';
import { parseProvenanceFromChunk0 } from '../provenance';
import { ImmutableRecordBadge } from '../../integrity/components/ImmutableRecordBadge';

export interface DocumentMetadataPanelProps {
  document: DocumentHeader | null;
  chunks: DocumentChunkItem[];
}

export function DocumentMetadataPanel(props: DocumentMetadataPanelProps) {
  const { document, chunks } = props;
  const [showRaw, setShowRaw] = useState(false);

  const chunk0 = useMemo(() => chunks.find((c) => c.chunkIndex === 0) ?? null, [chunks]);
  const parsed0 = useMemo(() => (chunk0 ? parseProvenanceFromChunk0(chunk0.content) : null), [chunk0]);

  if (!document) {
    return <Alert severity="info">Select a document to view metadata.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2">Metadata</Typography>
        <ImmutableRecordBadge />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {document.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Created: {new Date(document.createdAt).toLocaleString()}
      </Typography>

      {!parsed0?.provenance ? (
        <Alert severity="warning">
          Provenance header is missing from chunk 0. Without provenance, this document is harder to audit.
        </Alert>
      ) : (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Source kind
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {String(parsed0.provenance.source?.kind ?? 'unknown')}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Ingested at
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {parsed0.provenance.ingestedAt ? new Date(String(parsed0.provenance.ingestedAt)).toLocaleString() : 'unknown'}
          </Typography>

          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
            onClick={() => setShowRaw((v) => !v)}
          >
            {showRaw ? 'Hide raw header' : 'Show raw header'}
          </Button>

          {showRaw && parsed0.rawHeader ? (
            <Typography
              component="pre"
              variant="body2"
              sx={{
                mt: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-geist-mono)',
                bgcolor: 'action.hover',
                p: 1.5,
                borderRadius: 1,
                mb: 0,
              }}
            >
              {parsed0.rawHeader}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

