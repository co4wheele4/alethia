/**
 * DocumentDetailsPane
 * Presentation-only inspection pane for a selected document.
 */
'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks';
import { ContentSurface } from '../../../components/layout';
import { parseProvenanceFromChunk0 } from '../provenance';

function uniqueEntities(chunks: DocumentChunkItem[]) {
  const byId = new Map<string, { id: string; name: string; type: string }>();
  for (const chunk of chunks) {
    for (const m of chunk.mentions ?? []) {
      byId.set(m.entity.id, { id: m.entity.id, name: m.entity.name, type: m.entity.type });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function DocumentDetailsPane(props: {
  selectedId: string | null;
  document: DocumentHeader | null;
  chunks: DocumentChunkItem[];
  loading: boolean;
  error: Error | null;
}) {
  const { selectedId, document, chunks, loading, error } = props;

  const [entityFilterId, setEntityFilterId] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState('');
  const [showRawProvenance, setShowRawProvenance] = useState(false);

  const entities = useMemo(() => uniqueEntities(chunks), [chunks]);
  const sortedChunks = useMemo(
    () => chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex),
    [chunks]
  );

  const chunk0 = sortedChunks[0] ?? null;
  const parsed0 = useMemo(() => (chunk0 ? parseProvenanceFromChunk0(chunk0.content) : null), [chunk0]);

  const filteredChunks = useMemo(() => {
    const q = textFilter.trim().toLowerCase();
    return sortedChunks.filter((c) => {
      if (entityFilterId) {
        const has = (c.mentions ?? []).some((m) => m.entity.id === entityFilterId);
        if (!has) return false;
      }
      if (q) {
        const hay = c.content.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sortedChunks, entityFilterId, textFilter]);

  const copyCitation = async (chunkIndex: number) => {
    const citation = `Document ${selectedId ?? ''}, chunk ${chunkIndex}`;
    try {
      await navigator.clipboard.writeText(citation);
    } catch {
      // Best-effort fallback for environments without Clipboard API.
      window.prompt('Copy citation:', citation);
    }
  };

  if (!selectedId) {
    return (
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Inspect a document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a document on the left to view its raw chunks and extracted entity mentions.
        </Typography>
      </ContentSurface>
    );
  }

  return (
    <ContentSurface>
      <Typography variant="h6" gutterBottom>
        Document
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading document…</Typography>
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      {document ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{document.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            Created {new Date(document.createdAt).toLocaleString()}
          </Typography>
        </Box>
      ) : null}

      {parsed0?.provenance ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Provenance (immutable)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This metadata is embedded in the first evidence chunk at ingestion time.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {String(parsed0.provenance.source?.kind ?? 'unknown')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ingested at
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {parsed0.provenance.ingestedAt
                  ? new Date(String(parsed0.provenance.ingestedAt)).toLocaleString()
                  : 'unknown'}
              </Typography>
            </Box>

            {parsed0.provenance.source?.kind === 'url' ? (
              <>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">
                    URL
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {String(parsed0.provenance.source?.url ?? '')}
                  </Typography>
                </Box>
                {parsed0.provenance.source?.publisher ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Publisher (best-effort)
                    </Typography>
                    <Typography variant="body2">{String(parsed0.provenance.source.publisher)}</Typography>
                  </Box>
                ) : null}
                {parsed0.provenance.source?.publishedAt ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Published at (best-effort)
                    </Typography>
                    <Typography variant="body2">
                      {new Date(String(parsed0.provenance.source.publishedAt)).toLocaleString()}
                    </Typography>
                  </Box>
                ) : null}
              </>
            ) : null}

            {parsed0.provenance.source?.kind === 'file' ? (
              <>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">
                    Filename (ingestion artifact)
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                    {String(parsed0.provenance.source?.filename ?? '')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    MIME type
                  </Typography>
                  <Typography variant="body2">{String(parsed0.provenance.source?.mimeType ?? '')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Size (bytes)
                  </Typography>
                  <Typography variant="body2">{String(parsed0.provenance.source?.sizeBytes ?? '')}</Typography>
                </Box>
              </>
            ) : null}

            {parsed0.provenance.contentSha256 ? (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary">
                  Content SHA-256 (text snapshot)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {String(parsed0.provenance.contentSha256)}
                </Typography>
              </Box>
            ) : null}

            <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                sx={{ textTransform: 'none' }}
                onClick={() => setShowRawProvenance((v) => !v)}
              >
                {showRawProvenance ? 'Hide raw header' : 'Show raw header'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                sx={{ textTransform: 'none' }}
                onClick={() => void copyCitation(0)}
              >
                Copy citation (chunk 0)
              </Button>
            </Box>

            {showRawProvenance && parsed0.rawHeader ? (
              <Typography
                component="pre"
                variant="body2"
                sx={{
                  gridColumn: '1 / -1',
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
        </Box>
      ) : null}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Entity mentions (unique)
      </Typography>
      {entities.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No entity mentions found for this document.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {entities.map((e) => (
            <Chip
              key={e.id}
              label={`${e.name} (${e.type})`}
              size="small"
              variant={entityFilterId === e.id ? 'filled' : 'outlined'}
              color={entityFilterId === e.id ? 'primary' : 'default'}
              onClick={() => setEntityFilterId((prev) => (prev === e.id ? null : e.id))}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
        <TextField
          label="Search evidence"
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          size="small"
          fullWidth
        />
        <Button
          variant="outlined"
          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEntityFilterId(null);
            setTextFilter('');
          }}
          disabled={!entityFilterId && textFilter.trim().length === 0}
        >
          Clear filters
        </Button>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Evidence (immutable chunks)
      </Typography>

      {chunks.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary">
          No chunks available for this document.
        </Typography>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filteredChunks.map((chunk) => (
            <Accordion key={chunk.id} disableGutters elevation={0} sx={{ bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Chunk {chunk.chunkIndex}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    {chunk.mentions?.length ?? 0} mentions
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ textTransform: 'none' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void copyCitation(chunk.chunkIndex);
                    }}
                  >
                    Copy citation
                  </Button>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-geist-mono)',
                    bgcolor: 'action.hover',
                    p: 1.5,
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  {chunk.chunkIndex === 0 && parsed0?.rawHeader
                    ? showRawProvenance
                      ? chunk.content
                      : parsed0.body
                    : chunk.content}
                </Typography>

                {(chunk.mentions?.length ?? 0) > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {chunk.mentions.map((m) => (
                      <Chip
                        key={m.id}
                        size="small"
                        label={`${m.entity.name} (${m.entity.type})`}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No entity mentions in this chunk.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
      </Box>
    </ContentSurface>
  );
}

