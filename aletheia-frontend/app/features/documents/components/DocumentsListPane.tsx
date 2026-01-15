/**
 * DocumentsListPane
 * Presentation-only list + create + delete controls.
 */
'use client';

import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import type { DocumentIndexItem } from '../hooks/useDocumentIndex';
import { ContentSurface } from '../../../components/layout';

export function DocumentsListPane(props: {
  documents: DocumentIndexItem[];
  allDocumentsCount: number;
  filter: string;
  onFilterChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  busy: boolean;
  onDelete: (id: string) => Promise<void>;
  onOpenIngest: () => void;
  getSourceKind: (documentId: string) => string;
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
    getSourceKind,
  } = props;

  const statusLabelFor = (doc: DocumentIndexItem) => {
    if (doc.chunkCount === 0) return 'No chunks (ingestion incomplete)';
    if (doc.mentionCount === 0) return 'Chunks ready (no extracted mentions)';
    return 'Chunks + mentions ready';
  };

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
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Fetching document index (titles, timestamps, chunk/entity counts)…
          </Typography>
          <LinearProgress />
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
              primary={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {doc.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    Source type: {String(getSourceKind(doc.id) || 'unknown')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    Date added: {new Date(doc.dateAddedIso).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    Processing status: {statusLabelFor(doc)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    Entity count: {doc.entityCount}
                  </Typography>
                </Box>
              }
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

