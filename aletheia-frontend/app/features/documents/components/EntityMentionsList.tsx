'use client';

import Link from 'next/link';
import { Alert, Box, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';

export type EntityMentionRow = {
  mentionId: string;
  chunkId: string;
  chunkIndex: number;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
};

export type DocumentEntityRow = {
  id: string;
  name: string;
  type: string;
  mentionCount: number;
  mentions: EntityMentionRow[];
};

export function EntityMentionsList(props: {
  entities: DocumentEntityRow[];
  selectedEntityId: string | null;
  onSelectEntityId: (entityId: string) => void;
}) {
  const { entities, selectedEntityId, onSelectEntityId } = props;

  if (entities.length === 0) {
    return <Alert severity="info">No entity mentions were returned for this document.</Alert>;
  }

  const selected = entities.find((e) => e.id === selectedEntityId) ?? null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: 2, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Entities (from mentions)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Entities are pointers into evidence via explicit mention offsets.
        </Typography>

        <List dense aria-label="document-entities">
          {entities.map((e) => (
            <ListItemButton
              key={e.id}
              selected={e.id === selectedEntityId}
              onClick={() => onSelectEntityId(e.id)}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={e.name}
                secondary={`Type: ${e.type ? e.type : '(missing)'} • Mentions: ${e.mentionCount}`}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Mentions for selected entity
        </Typography>

        {!selected ? (
          <Alert severity="info">Select an entity to inspect its mentions.</Alert>
        ) : selected.mentions.length === 0 ? (
          <Alert severity="info">No mentions are linked to this entity in the selected document.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Entity: <strong>{selected.name}</strong> • <Link href={`/entities/${selected.id}`}>Open entity page</Link>
            </Typography>
            <Divider />

            {selected.mentions
              .slice()
              .sort((a, b) => (a.chunkIndex - b.chunkIndex) || ((a.startOffset ?? 0) - (b.startOffset ?? 0)))
              .map((m) => (
                <Box key={m.mentionId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Mention ID: {m.mentionId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Chunk: {m.chunkIndex} (chunkId={m.chunkId})
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Offsets: [{String(m.startOffset)}, {String(m.endOffset)}) • Excerpt: {m.excerpt ?? '(missing)'}
                  </Typography>
                </Box>
              ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

