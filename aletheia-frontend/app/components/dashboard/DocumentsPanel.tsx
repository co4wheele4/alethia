/**
 * DocumentsPanel
 * Documents slice (dashboard)
 *
 * Dashboard surfaces Documents as the primary “source of truth” container.
 * In Aletheia, Documents come from ingestion (upload / URL / manual text).
 * We do not create empty documents here, and we do not expose "files" post-ingest.
 */

'use client';

import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Alert,
} from '@mui/material';

import { useDocuments } from '../../features/documents/hooks/useDocuments';

export function DocumentsPanel({ userId }: { userId: string | null }) {
  const { documents, loading, error } = useDocuments(userId);
  const recent = documents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5">Documents</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {userId ? (
            <Button component={Link} href="/documents?ingest=1" variant="contained" sx={{ textTransform: 'none' }}>
              Add sources
            </Button>
          ) : (
            <Button variant="contained" sx={{ textTransform: 'none' }} disabled>
              Add sources
            </Button>
          )}
          <Button component={Link} href="/documents" variant="outlined" sx={{ textTransform: 'none' }}>
            Open library
          </Button>
        </Box>
      </Box>

      {!userId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Documents are available after login. (Unable to determine user id from token.)
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {loading && userId ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading documents…</Typography>
        </Box>
      ) : null}

      <List dense aria-label="documents-list">
        {recent.map((doc) => (
          <ListItemButton key={doc.id} component={Link} href="/documents" sx={{ borderRadius: 1 }}>
            <ListItemText primary={doc.title} secondary={new Date(doc.createdAt).toLocaleString()} />
          </ListItemButton>
        ))}
      </List>

      {userId && !loading && documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No documents yet. Add a source (upload, URL, or manual text) to begin.
        </Typography>
      ) : null}
    </Box>
  );
}

