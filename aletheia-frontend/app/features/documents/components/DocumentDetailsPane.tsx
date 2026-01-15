/**
 * DocumentDetailsPane
 * Presentation-only inspection pane for a selected document.
 */
'use client';

import {
  Alert,
  Box,
  LinearProgress,
  Typography,
} from '@mui/material';

import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks';
import { ContentSurface } from '../../../components/layout';
import { DocumentInspectionView } from './DocumentInspectionView';

export function DocumentDetailsPane(props: {
  selectedId: string | null;
  document: DocumentHeader | null;
  chunks: DocumentChunkItem[];
  loading: boolean;
  error: Error | null;
  initialChunkIndex?: number | null;
}) {
  const { selectedId, document, chunks, loading, error, initialChunkIndex } = props;

  if (!selectedId) {
    return (
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Inspect a document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a document on the left to view its chunked evidence, metadata, and extracted entities.
        </Typography>
      </ContentSurface>
    );
  }

  return (
    <ContentSurface>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      {document ? (
        <Box sx={{ mb: 2, minWidth: 0 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0.25 }}>
            {document.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Date added: {new Date(document.createdAt).toLocaleString()}
          </Typography>
        </Box>
      ) : null}

      {loading ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Loading document evidence (metadata, chunks, entity mentions)…
          </Typography>
          <LinearProgress />
        </Box>
      ) : null}

      <Box sx={{ minWidth: 0 }}>
        <DocumentInspectionView document={document} chunks={chunks} initialChunkIndex={initialChunkIndex} />
      </Box>
    </ContentSurface>
  );
}

