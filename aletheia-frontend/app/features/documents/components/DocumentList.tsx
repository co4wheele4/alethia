'use client';

import { Alert, Box, CircularProgress, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import type { DocumentListItem } from '../hooks/useDocuments';

export interface DocumentListProps {
  documents: DocumentListItem[];
  selectedId: string | null;
  loading?: boolean;
  error?: Error | null;
  onSelect: (documentId: string) => void;
}

export function DocumentList(props: DocumentListProps) {
  const { documents, selectedId, onSelect, loading, error } = props;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Documents
      </Typography>

      {error ? <Alert severity="error">{error.message}</Alert> : null}

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading documents…</Typography>
        </Box>
      ) : null}

      {!loading && documents.length === 0 ? (
        <Alert severity="info">No documents yet. Ingest a source to create immutable evidence.</Alert>
      ) : null}

      <List dense aria-label="document-list">
        {documents.map((d) => (
          <ListItemButton
            key={d.id}
            selected={d.id === selectedId}
            onClick={() => onSelect(d.id)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText primary={d.title} secondary={new Date(d.createdAt).toLocaleString()} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

