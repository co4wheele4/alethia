'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { parseProvenanceFromChunk0 } from '../../documents/provenance';
import { EntityRelationshipGraph } from './EntityRelationshipGraph';
import type { EntityDetail } from '../hooks/useEntity';

function excerpt(text: string, max = 280) {
  const s = text.trim().replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function EntityDetailView(props: {
  entity: EntityDetail | null;
  loading: boolean;
  error: Error | null;
}) {
  const { entity, loading, error } = props;
  const [q, setQ] = useState('');

  const mentions = useMemo(() => {
    const m = entity?.mentions ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return m;
    return m.filter((x) => x.chunk.content.toLowerCase().includes(query));
  }, [entity, q]);

  const chunk0 = useMemo(() => {
    // Best-effort: some APIs may return the header chunk among mentions.
    const candidates = mentions
      .map((m) => m.chunk)
      .filter((c) => c.chunkIndex === 0)
      .sort((a, b) => a.document.createdAt.localeCompare(b.document.createdAt));
    return candidates[0] ?? null;
  }, [mentions]);
  const parsed0 = useMemo(() => (chunk0 ? parseProvenanceFromChunk0(chunk0.content) : null), [chunk0]);

  return (
    <ContentSurface>
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading entity…</Typography>
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      {!loading && !error && !entity ? (
        <Alert severity="info">Entity not found.</Alert>
      ) : null}

      {entity ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            {entity.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Type: {entity.type || 'unknown'} • Mentions: {entity.mentions?.length ?? 0}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <EntityRelationshipGraph entity={entity} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Mentions (evidence links)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Each mention is anchored to a specific chunk. Inspect the chunk content directly before drawing
            conclusions.
          </Typography>

          <TextField
            label="Search within mention chunks"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          {parsed0?.provenance ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Provenance is available for at least one related document via chunk 0 metadata. See{' '}
              <Button component={Link} href="/provenance" size="small" sx={{ textTransform: 'none' }}>
                Provenance
              </Button>{' '}
              for full inspection.
            </Alert>
          ) : null}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mentions.map((m) => (
              <Box
                key={m.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Document: {m.chunk.document.title} • Chunk {m.chunk.chunkIndex}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
                  {excerpt(m.chunk.content)}
                </Typography>
              </Box>
            ))}

            {!loading && (entity.mentions?.length ?? 0) > 0 && mentions.length === 0 ? (
              <Alert severity="info">No mentions match your search.</Alert>
            ) : null}

            {!loading && (entity.mentions?.length ?? 0) === 0 ? (
              <Alert severity="info">No mentions are available for this entity.</Alert>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </ContentSurface>
  );
}

