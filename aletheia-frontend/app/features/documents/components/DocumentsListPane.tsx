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
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { useMemo, useState } from 'react';
import type { DocumentIndexItem } from '../hooks/useDocumentIndex';
import { ContentSurface } from '../../../components/layout';
import { WorkspaceEmptyHelp } from '../../../components/common/WorkspaceEmptyHelp';

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
  userRole?: string | null;
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
    userRole,
  } = props;

  const [visibleCount, setVisibleCount] = useState(25);
  const visible = useMemo(() => documents.slice(0, visibleCount), [documents, visibleCount]);
  const canLoadMore = documents.length > visible.length;

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
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            No documents yet. Add a source (upload, URL, or manual text) to begin.
          </Alert>
          <WorkspaceEmptyHelp surface="documents" userRole={userRole} />
        </Box>
      ) : null}

      {allDocumentsCount > 0 && documents.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No documents match your filter.
        </Alert>
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Showing {visible.length} of {documents.length} documents. (API does not provide pagination parameters.)
      </Typography>

      <List dense aria-label="documents-list">
        {visible.map((doc) => (
          <ListItem
            key={doc.id}
            // Ensure `scrollIntoViewIfNeeded()` doesn't place list items under the fixed AppBar (mobile).
            sx={{
              scrollMarginTop: 88,
              position: 'relative',
              '& .MuiListItemSecondaryAction-root': { zIndex: 3 },
            }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`Delete ${doc.title}`}
                onClick={() => {
                  void onDelete(doc.id);
                }}
                disabled={busy}
                data-testid={`delete-document-${doc.id}`}
                sx={{ position: 'relative', zIndex: 3 }}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton
              selected={doc.id === selectedId}
              onClick={() => onSelect(doc.id)}
              // Keep the primary button hit-target from covering the trailing delete action on touch layouts.
              // (Some mobile browsers report the primary button intercepting clicks otherwise.)
              sx={{ borderRadius: 1, position: 'relative', zIndex: 0, width: 'calc(100% - 72px)' }}
            >
              <ListItemText
                // Prevent the text subtree from overlapping/intercepting the secondaryAction hit-target (mobile).
                sx={{ pointerEvents: 'none' }}
                primary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {doc.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      Source type: {doc.sourceType ?? '(missing)'}
                      {doc.sourceLabel ? ` • ${doc.sourceLabel}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      Date added: {new Date(doc.dateAddedIso).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      Chunks: {doc.chunkCount} • Mentions: {doc.mentionCount} • Entities: {doc.entityCount}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {canLoadMore ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
            onClick={() => setVisibleCount((v) => v + 25)}
          >
            Load more
          </Button>
        </Box>
      ) : null}
    </ContentSurface>
  );
}

