/**
 * DocumentsListPane
 * Presentation-only list + create + delete controls.
 */
'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import type { DocumentListItem } from '../hooks/useDocuments';
import { ContentSurface } from '../../../components/layout';

export function DocumentsListPane(props: {
  documents: DocumentListItem[];
  allDocumentsCount: number;
  filter: string;
  onFilterChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  busy: boolean;
  onDelete: (id: string) => Promise<void>;
  onOpenIngest: () => void;
}) {
  const {
    documents,
    allDocumentsCount,
    filter,
    onFilterChange,
    selectedId,
    onSelect,
    loading,
    busy,
    onDelete,
    onOpenIngest,
  } = props;

  return (
    <ContentSurface>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5">Documents</Typography>
        <Button
          variant="contained"
          onClick={onOpenIngest}
          disabled={busy}
          sx={{ textTransform: 'none' }}
          data-testid="open-ingest-dialog"
        >
          Add sources
        </Button>
      </Box>

      <TextField
        label="Filter"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        fullWidth
        size="small"
        disabled={busy}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading documents…</Typography>
        </Box>
      ) : null}

      {allDocumentsCount === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No documents yet. Add a source (upload, URL, or manual text) to begin.
        </Alert>
      ) : null}

      {allDocumentsCount > 0 && documents.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No documents match your filter.
        </Alert>
      ) : null}

      <List dense aria-label="documents-list">
        {documents.map((doc) => (
          <ListItemButton
            key={doc.id}
            selected={doc.id === selectedId}
            onClick={() => onSelect(doc.id)}
            sx={{ borderRadius: 1 }}
          >
            <ListItemText
              primary={doc.title}
              secondary={new Date(doc.createdAt).toLocaleString()}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
            <IconButton
              edge="end"
              aria-label={`Delete ${doc.title}`}
              onClick={(e) => {
                e.stopPropagation();
                void onDelete(doc.id);
              }}
              disabled={busy}
              data-testid={`delete-document-${doc.id}`}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    </ContentSurface>
  );
}

