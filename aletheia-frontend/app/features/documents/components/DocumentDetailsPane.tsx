/**
 * DocumentDetailsPane
 * Presentation-only inspection pane for a selected document.
 */
'use client';

import {
  Box,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { DocumentDetailPanel } from './DocumentDetailPanel';

export function DocumentDetailsPane(props: {
  selectedId: string | null;
  initialChunkIndex?: number | null;
}) {
  const { selectedId, initialChunkIndex } = props;

  if (!selectedId) {
    return (
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Inspect a document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a document on the left to view provenance, offset-linked mentions, and relationship evidence.
        </Typography>
      </ContentSurface>
    );
  }

  return (
    <ContentSurface>
      {/* The underlying panel fetches data and surfaces explicit errors/states. */}
      <Box sx={{ minWidth: 0 }}>
        <DocumentDetailPanel documentId={selectedId} initialChunkIndex={initialChunkIndex ?? null} />
      </Box>
    </ContentSurface>
  );
}

