'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { AppShell } from '../components/shell';
import { ContentSurface } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { useDocumentDetails } from '../features/documents/hooks/useDocumentChunks';
import { ProvenanceInspector } from '../features/provenance/components/ProvenanceInspector';

export default function ProvenancePage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  const { documents, loading, error } = useDocuments(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = useMemo(() => {
    if (selectedId && documents.some((d) => d.id === selectedId)) return selectedId;
    return documents[0]?.id ?? null;
  }, [documents, selectedId]);

  const details = useDocumentDetails(activeId);

  return (
    <AppShell title="Provenance">
      {!userId ? (
        <Alert severity="info">Provenance inspection is available after login.</Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 2 }}>
          <ContentSurface>
            <Typography variant="h6" gutterBottom>
              Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a document to inspect its immutable ingestion header and available audit signals.
            </Typography>

            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            ) : null}

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Loading documents…</Typography>
              </Box>
            ) : null}

            <List dense aria-label="provenance-documents">
              {documents.map((d) => (
                <ListItemButton
                  key={d.id}
                  selected={d.id === activeId}
                  onClick={() => setSelectedId(d.id)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText primary={d.title} secondary={new Date(d.createdAt).toLocaleString()} />
                </ListItemButton>
              ))}
            </List>
          </ContentSurface>

          <ContentSurface>
            {details.error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {details.error.message}
              </Alert>
            ) : null}

            {details.loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Loading provenance…</Typography>
              </Box>
            ) : null}

            <ProvenanceInspector document={details.document} chunks={details.chunks} />
          </ContentSurface>
        </Box>
      )}
    </AppShell>
  );
}

