'use client';

import { useMemo } from 'react';
import {
  Alert,
  Box,
  Divider,
  LinearProgress,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { parseProvenanceFromChunk0 } from '../../documents/provenance';
import { EntityRelationshipGraph } from './EntityRelationshipGraph';
import type { EntityDetail } from '../hooks/useEntity';
import { EntityMentionsList } from './EntityMentionsList';

export function EntityDetailView(props: {
  entity: EntityDetail | null;
  loading: boolean;
  error: Error | null;
}) {
  const { entity, loading, error } = props;
  const mentions = useMemo(() => entity?.mentions ?? [], [entity]);

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
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Loading entity (relationships + mentions)…
          </Typography>
          <LinearProgress />
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
            Type: {entity.type || 'unknown'} • Mentions: {entity.mentionCount ?? entity.mentions?.length ?? 0}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <EntityRelationshipGraph entity={entity} />

          <Divider sx={{ my: 2 }} />

          {parsed0?.provenance ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Provenance is available for at least one related document via chunk 0 metadata. Use the document viewer
              metadata panel to inspect it.
            </Alert>
          ) : null}

          <EntityMentionsList
            entityId={entity.id}
            entityName={entity.name}
            entityType={entity.type}
            mentions={mentions}
          />
        </Box>
      ) : null}
    </ContentSurface>
  );
}

