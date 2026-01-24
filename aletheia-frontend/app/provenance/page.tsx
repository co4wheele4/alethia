'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Button, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { AppShell, ContentSurface } from '../components/layout';
import { LadyJusticeProgressIndicator } from '../components/primitives/LadyJusticeProgressIndicator';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { ProvenanceInspector } from '../features/provenance/components/ProvenanceInspector';
import { SelectedDocumentHeaderQueryContainer } from '../features/documents/components/SelectedDocumentHeaderQueryContainer';
import { SelectedDocumentChunksQueryContainer } from '../features/documents/components/SelectedDocumentChunksQueryContainer';

export default function ProvenancePage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  const { documents, loading, error } = useDocuments(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(25);

  const activeId = useMemo(() => {
    if (selectedId && documents.some((d) => d.id === selectedId)) return selectedId;
    return documents[0]?.id ?? null;
  }, [documents, selectedId]);

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
                <LadyJusticeProgressIndicator size={18} />
                <Typography variant="body2">Loading documents…</Typography>
              </Box>
            ) : null}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Showing {Math.min(visibleDocumentsCount, documents.length)} of {documents.length}. (API does not provide pagination parameters.)
            </Typography>
            <List dense aria-label="provenance-documents">
              {documents.slice(0, visibleDocumentsCount).map((d) => (
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
            {documents.length > visibleDocumentsCount ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleDocumentsCount((v) => v + 25)}>
                  Load more documents
                </Button>
              </Box>
            ) : null}
          </ContentSurface>

          <ContentSurface>
            <SelectedDocumentHeaderQueryContainer documentId={activeId}>
              {({ document, loading: docLoading, error: docError }) => (
                <SelectedDocumentChunksQueryContainer documentId={activeId}>
                  {({ chunks, loading: chunksLoading, error: chunksError }) => {
                    const loading = docLoading || chunksLoading;
                    const error = docError ?? chunksError;
                    return (
                      <>
                        {error ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {error.message}
                          </Alert>
                        ) : null}

                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                            <LadyJusticeProgressIndicator size={18} />
                            <Typography variant="body2">Loading provenance…</Typography>
                          </Box>
                        ) : null}

                        <ProvenanceInspector document={document} chunks={chunks} />
                      </>
                    );
                  }}
                </SelectedDocumentChunksQueryContainer>
              )}
            </SelectedDocumentHeaderQueryContainer>
          </ContentSurface>
        </Box>
      )}
    </AppShell>
  );
}

