'use client';

import Link from 'next/link';
import { Alert, Box, Button, List, ListItem, ListItemText, Typography } from '@mui/material';

export function CompletionStep(props: { createdDocumentIds: string[] }) {
  const { createdDocumentIds } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Completed</Typography>

      <Alert severity="success">
        Ingestion is complete. Next, inspect your documents as evidence before starting any analysis or Q&A.
      </Alert>

      {createdDocumentIds.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Created documents
          </Typography>
          <List dense>
            {createdDocumentIds.map((id) => (
              <ListItem key={id}>
                <ListItemText primary={id} secondary="Open in Documents to inspect chunks and provenance." />
              </ListItem>
            ))}
          </List>
        </Box>
      ) : (
        <Alert severity="info">No documents were ingested in this run. You can add sources anytime from Documents.</Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button component={Link} href="/documents" variant="contained" sx={{ textTransform: 'none' }}>
          Go to Document Index
        </Button>
        <Button component={Link} href="/documents?ingest=1" variant="outlined" sx={{ textTransform: 'none' }}>
          Add another source
        </Button>
      </Box>

      <Alert severity="warning">
        Reminder: Aletheia does not “prove” claims. It helps you connect claims back to inspectable sources.
      </Alert>
    </Box>
  );
}

