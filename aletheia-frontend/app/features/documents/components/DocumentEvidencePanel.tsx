/**
 * DocumentEvidencePanel
 *
 * Right-side panel for the Document Viewer:
 * - immutable metadata (from Document + provenance header)
 * - entity index (extracted) with mention counts and evidence navigation
 *
 * This component must not summarize content.
 */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Alert, Box, Button, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks';
import { DocumentMetadataPanel } from './DocumentMetadataPanel';

type EntityIndexRow = {
  id: string;
  name: string;
  type: string;
  mentionCount: number;
};

function buildEntityIndex(chunks: DocumentChunkItem[]): EntityIndexRow[] {
  const byId = new Map<string, EntityIndexRow>();

  for (const c of chunks) {
    for (const m of c.mentions ?? []) {
      const e = m.entity;
      const prev = byId.get(e.id);
      byId.set(e.id, {
        id: e.id,
        name: e.name,
        type: e.type,
        mentionCount: (prev?.mentionCount ?? 0) + 1,
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function DocumentEvidencePanel(props: { document: DocumentHeader | null; chunks: DocumentChunkItem[] }) {
  const { document, chunks } = props;

  const entities = useMemo(() => buildEntityIndex(chunks), [chunks]);
  const [visibleCount, setVisibleCount] = useState(50);
  const visible = useMemo(() => entities.slice(0, visibleCount), [entities, visibleCount]);
  const canLoadMore = entities.length > visible.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DocumentMetadataPanel document={document} chunks={chunks} />

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Entities (extracted)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Entities are extracted mentions. Treat them as pointers into evidence, not conclusions.
        </Typography>

        {entities.length === 0 ? (
          <Alert severity="info">No entity mentions were returned for this document.</Alert>
        ) : (
          <List dense aria-label="document-entities">
            {visible.map((e) => (
              <Link key={e.id} href={`/entities/${e.id}`} passHref legacyBehavior>
                <ListItemButton component="a" sx={{ borderRadius: 1 }}>
                  <ListItemText
                    primary={e.name}
                    secondary={`Type: ${e.type || 'unknown'} • Mentions: ${e.mentionCount} • Confidence: unknown`}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              </Link>
            ))}
          </List>
        )}

        {canLoadMore ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleCount((v) => v + 50)}>
              Load more entities
            </Button>
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Link href="/entities" passHref legacyBehavior>
            <Button component="a" size="small" variant="text" sx={{ textTransform: 'none' }}>
              Browse all entities
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

