/**
 * DocumentDetailsPane
 * Presentation-only inspection pane for a selected document.
 */
'use client';

import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { ContentSurface } from '../../../components/layout';
import { DocumentDetailPanel } from './DocumentDetailPanel';
import { EvidenceDrawer } from '../../evidence/components/EvidenceDrawer';

export function DocumentDetailsPane(props: {
  selectedId: string | null;
  initialChunkIndex?: number | null;
  deepLinkDocumentId?: string | null;
  deepLinkMentionId?: string | null;
}) {
  const { selectedId, initialChunkIndex, deepLinkDocumentId, deepLinkMentionId } = props;

  const canDeepLinkOpen = Boolean(selectedId && deepLinkDocumentId && selectedId === deepLinkDocumentId && deepLinkMentionId);
  const [deepLinkDismissed, setDeepLinkDismissed] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [activeMentionId, setActiveMentionId] = useState<string | null>(() => (canDeepLinkOpen ? deepLinkMentionId! : null));

  const drawerOpen = evidenceOpen || (canDeepLinkOpen && !deepLinkDismissed);
  const drawerMentionId = activeMentionId ?? (canDeepLinkOpen && !deepLinkDismissed ? deepLinkMentionId! : null);

  if (!selectedId) {
    return (
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Inspect a document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a document on the left to view provenance, offset-linked mentions, and relationship evidence.
        </Typography>
      </ContentSurface>
    );
  }

  return (
    <ContentSurface>
      {/* The underlying panel fetches data and surfaces explicit errors/states. */}
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              Document inspection
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Evidence inspection is read-only and offset-anchored. No confidence is shown.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none' }}
            onClick={() => {
              setActiveMentionId(null);
              setEvidenceOpen(true);
            }}
          >
            Open evidence drawer
          </Button>
        </Stack>

        <DocumentDetailPanel documentId={selectedId} initialChunkIndex={initialChunkIndex ?? null} />
      </Box>

      <EvidenceDrawer
        key={`${selectedId}:${drawerMentionId ?? 'none'}:${drawerOpen ? 'open' : 'closed'}`}
        open={drawerOpen}
        onClose={() => {
          setEvidenceOpen(false);
          setActiveMentionId(null);
          setDeepLinkDismissed(true);
        }}
        documentId={selectedId}
        mentionId={drawerMentionId}
      />
    </ContentSurface>
  );
}

