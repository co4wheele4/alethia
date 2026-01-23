'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, List, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';

import type { DocumentEntityRow, EvidenceDocument } from '../hooks/useDocumentEvidence';

export function EntityListPanel(props: {
  document: EvidenceDocument | null;
  entities: DocumentEntityRow[];
  selectedEntityId: string | null;
  onSelectEntityId: (id: string | null) => void;
}) {
  const { document, entities, selectedEntityId, onSelectEntityId } = props;
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return entities;
    return entities.filter((e) => e.entity.name.toLowerCase().includes(query) || e.entity.type.toLowerCase().includes(query));
  }, [entities, q]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Entities (from explicit mentions)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          This list is derived from mention rows in the selected document. No inferred entities are shown.
        </Typography>
      </Box>

      {!document ? <Alert severity="info">Select a document to see extracted entities.</Alert> : null}

      <TextField
        label="Filter entities"
        size="small"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={!document}
      />

      <List dense aria-label="truth-entities">
        {filtered.map((row) => (
          <ListItemButton
            key={row.entity.id}
            selected={row.entity.id === selectedEntityId}
            onClick={() => onSelectEntityId(row.entity.id)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText
              primary={row.entity.name}
              secondary={`Type: ${row.entity.type || '—'} • Mentions in document: ${row.mentions.length}`}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        ))}
      </List>

      {document && entities.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          Showing {filtered.length} of {entities.length}
        </Typography>
      ) : null}
    </Box>
  );
}

