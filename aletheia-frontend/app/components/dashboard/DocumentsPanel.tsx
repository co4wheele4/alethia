/**
 * DocumentsPanel
 * Minimal authenticated CRUD slice: list + create + delete documents
 */

'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  CREATE_DOCUMENT_MUTATION,
  DELETE_DOCUMENT_MUTATION,
  DOCUMENTS_BY_USER_QUERY,
} from '../../lib/graphql/queries';

type DocumentItem = {
  id: string;
  title: string;
  createdAt: string;
};

type DocumentsByUserData = {
  documentsByUser: DocumentItem[];
};

type DocumentsByUserVars = {
  userId: string;
};

type CreateDocumentData = {
  createDocument: DocumentItem;
};

type CreateDocumentVars = {
  title: string;
  userId: string;
};

type DeleteDocumentData = {
  deleteDocument: { id: string };
};

type DeleteDocumentVars = {
  id: string;
};

export function DocumentsPanel({ userId }: { userId: string | null }) {
  const [title, setTitle] = useState('');
  const trimmedTitle = useMemo(() => title.trim(), [title]);

  const { data, loading, error, refetch } = useQuery<
    DocumentsByUserData,
    DocumentsByUserVars
  >(DOCUMENTS_BY_USER_QUERY, {
    // Provide a stable variables object for typing; query is skipped when userId is missing.
    variables: { userId: userId ?? '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const [createDocument, { loading: creating, error: createError }] = useMutation<
    CreateDocumentData,
    CreateDocumentVars
  >(CREATE_DOCUMENT_MUTATION);

  const [deleteDocument, { loading: deleting, error: deleteError }] = useMutation<
    DeleteDocumentData,
    DeleteDocumentVars
  >(DELETE_DOCUMENT_MUTATION);

  const isBusy = creating || deleting;

  const onAdd = async () => {
    if (!userId) return;
    if (!trimmedTitle) return;

    await createDocument({
      variables: { title: trimmedTitle, userId },
    });

    setTitle('');
    await refetch();
  };

  const onDelete = async (id: string) => {
    await deleteDocument({ variables: { id } });
    await refetch();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Documents
      </Typography>

      {!userId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Documents are available after login. (Unable to determine user id from token.)
        </Alert>
      )}

      {(error || createError || deleteError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message || createError?.message || deleteError?.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <TextField
          label="New document title"
          name="documentTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          inputProps={{ 'data-testid': 'document-title-input' }}
          disabled={!userId || isBusy}
        />
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={!userId || isBusy || !trimmedTitle}
          data-testid="add-document-button"
          sx={{ whiteSpace: 'nowrap' }}
        >
          {creating ? <CircularProgress size={20} /> : 'Add'}
        </Button>
      </Box>

      {loading && userId ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading documents…</Typography>
        </Box>
      ) : null}

      <List dense aria-label="documents-list">
        {(data?.documentsByUser ?? []).map((doc) => (
          <ListItem
            key={doc.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`Delete ${doc.title}`}
                onClick={() => onDelete(doc.id)}
                disabled={isBusy}
                data-testid={`delete-document-${doc.id}`}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={doc.title}
              secondary={new Date(doc.createdAt).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>

      {userId && !loading && (data?.documentsByUser?.length ?? 0) === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No documents yet. Create your first one above.
        </Typography>
      ) : null}
    </Box>
  );
}

