'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Button, Divider, Typography } from '@mui/material';

import { parseProvenanceFromChunk0 } from '../../documents/provenance';
import type { DocumentChunkItem, DocumentHeader } from '../../documents/hooks/useDocumentChunks';
import { TransformationStepList, type TransformationStep } from './TransformationStepList';

export interface ProvenanceInspectorProps {
  document: DocumentHeader | null;
  chunks: DocumentChunkItem[];
}

export function ProvenanceInspector(props: ProvenanceInspectorProps) {
  const { document, chunks } = props;
  const [showRaw, setShowRaw] = useState(false);

  const chunk0 = useMemo(() => chunks.find((c) => c.chunkIndex === 0) ?? null, [chunks]);
  const parsed0 = useMemo(() => (chunk0 ? parseProvenanceFromChunk0(chunk0.content) : null), [chunk0]);

  const steps: TransformationStep[] = useMemo(() => {
    const ingestedAt = parsed0?.provenance?.ingestedAt ? String(parsed0.provenance.ingestedAt) : null;
    return [
      {
        key: 'ingest',
        label: 'Ingested (snapshot created)',
        timestampIso: ingestedAt,
        status: ingestedAt ? 'known' : 'unknown',
        detail: parsed0?.provenance?.source?.kind
          ? `Source kind: ${String(parsed0.provenance.source.kind)}`
          : 'Source kind: unknown',
      },
      {
        key: 'chunking',
        label: 'Chunking',
        timestampIso: null,
        status: 'inferred',
        detail: `Derived from presence of ${chunks.length} chunk(s). Timestamp is not available from API.`,
      },
      {
        key: 'entity-extraction',
        label: 'Entity extraction',
        timestampIso: null,
        status: 'unknown',
        detail: 'No explicit extraction step/timestamp is available from API.',
      },
      {
        key: 'embedding',
        label: 'Embedding generation',
        timestampIso: null,
        status: 'unknown',
        detail: 'No explicit embedding step/timestamp is available from API.',
      },
    ];
  }, [chunks.length, parsed0]);

  if (!document) {
    return (
      <Alert severity="info">
        Select a document to inspect provenance. Provenance is derived from immutable chunk 0 metadata.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Provenance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Provenance is shown as stored. Sources are immutable. If a field is missing, it is shown as unknown.
      </Typography>

      {!chunk0 ? (
        <Alert severity="warning">No chunk 0 available; cannot parse ingestion provenance.</Alert>
      ) : !parsed0?.provenance ? (
        <Alert severity="warning">
          Chunk 0 does not contain a provenance header. This may mean the ingestion pipeline did not embed it.
        </Alert>
      ) : (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Document
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {document.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Created: {new Date(document.createdAt).toLocaleString()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Ingestion header (immutable)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source kind
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {String(parsed0.provenance.source?.kind || 'unknown')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ingested at
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {parsed0.provenance.ingestedAt ? new Date(String(parsed0.provenance.ingestedAt)).toLocaleString() : 'unknown'}
              </Typography>
            </Box>

            {parsed0.provenance.contentSha256 ? (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">
                  Content SHA-256 (snapshot)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {String(parsed0.provenance.contentSha256)}
                </Typography>
              </Box>
            ) : null}

            {parsed0.provenance.source?.kind === 'url' ? (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">
                  URL
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {String(parsed0.provenance.source?.url || '')}
                </Typography>
              </Box>
            ) : null}

            {parsed0.provenance.source?.kind === 'file' ? (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">
                  Filename (ingestion artifact)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {String(parsed0.provenance.source?.filename ?? '')}
                </Typography>
              </Box>
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: 'none' }}
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? 'Hide raw header' : 'Show raw header'}
            </Button>
          </Box>

          {showRaw && parsed0.rawHeader ? (
            <Typography
              component="pre"
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-geist-mono)',
                bgcolor: 'action.hover',
                p: 1.5,
                borderRadius: 1,
                mt: 2,
                mb: 0,
              }}
            >
              {parsed0.rawHeader}
            </Typography>
          ) : null}
        </Box>
      )}

      <TransformationStepList steps={steps} />
    </Box>
  );
}

