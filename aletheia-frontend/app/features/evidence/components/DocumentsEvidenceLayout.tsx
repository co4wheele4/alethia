'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useDocumentEvidence } from '../hooks/useDocumentEvidence';
import { useEntityMentions } from '../hooks/useEntityMentions';
import { DocumentTextViewer } from './DocumentTextViewer';
import { EntityEvidencePanel } from './EntityEvidencePanel';
import { EntityListPanel } from './EntityListPanel';

export function DocumentsEvidenceLayout(props: { userId: string | null }) {
  const { userId } = props;
  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const activeDocumentId = useMemo(() => {
    if (selectedDocumentId && documents.some((d) => d.id === selectedDocumentId)) return selectedDocumentId;
    return documents[0]?.id ?? null;
  }, [documents, selectedDocumentId]);

  const { document, entities, loading: docLoading, error: docError } = useDocumentEvidence(activeDocumentId);
  const { mentions, rangesByChunkId, chunksById } = useEntityMentions({ document, entityId: selectedEntityId });

  if (!userId) {
    return <Alert severity="info">Evidence viewing is available after login.</Alert>;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '320px 360px 1fr' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Document Evidence Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a document, select an entity, and inspect explicit evidence: provenance, chunk text, and offsets.
        </Typography>

        {docsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {docsError.message}
          </Alert>
        ) : null}

        {docsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading documents…</Typography>
          </Box>
        ) : null}

        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Documents
        </Typography>
        <List dense aria-label="truth-documents">
          {documents.map((d) => (
            <ListItemButton
              key={d.id}
              selected={d.id === activeDocumentId}
              onClick={() => {
                setSelectedDocumentId(d.id);
                setSelectedEntityId(null);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={d.title}
                secondary={new Date(d.createdAt).toLocaleString()}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </ContentSurface>

      <ContentSurface>
        {docError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {docError.message}
          </Alert>
        ) : null}
        {docLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading document evidence…</Typography>
          </Box>
        ) : null}

        <EntityListPanel
          document={document}
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntityId={(id) => setSelectedEntityId(id)}
        />
      </ContentSurface>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <ContentSurface>
          <EntityEvidencePanel
            document={document}
            selectedEntityId={selectedEntityId}
            mentions={mentions}
            chunksById={chunksById}
          />
        </ContentSurface>

        <Divider />

        <ContentSurface>
          <DocumentTextViewer document={document} activeEntityId={selectedEntityId} rangesByChunkId={rangesByChunkId} />
        </ContentSurface>
      </Box>
    </Box>
  );
}

