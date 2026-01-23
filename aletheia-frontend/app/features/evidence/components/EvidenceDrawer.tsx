'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useDocumentEvidence } from '../hooks/useDocumentEvidence';
import { useEntityMentions } from '../hooks/useEntityMentions';
import { EvidenceList } from './EvidenceList';
import { DocumentTextViewer } from './DocumentTextViewer';

function fail(message: string): never {
  throw new Error(`[Truth Surface] ${message}`);
}

function provenanceSummary(doc: NonNullable<ReturnType<typeof useDocumentEvidence>['document']>) {
  const src = doc.source;
  if (!doc.sourceType || !doc.sourceLabel || !src) {
    fail('Document provenance is missing (requires sourceType, sourceLabel, and source)');
  }
  const parts: string[] = [];
  parts.push(`sourceType=${String(doc.sourceType)}`);
  parts.push(`sourceLabel=${String(doc.sourceLabel)}`);
  parts.push(`kind=${String(src.kind)}`);
  if (src.requestedUrl) parts.push(`requestedUrl=${src.requestedUrl}`);
  if (src.fetchedUrl) parts.push(`fetchedUrl=${src.fetchedUrl}`);
  if (src.filename) parts.push(`filename=${src.filename}`);
  if (src.ingestedAt) parts.push(`ingestedAt=${src.ingestedAt}`);
  return parts.join(' • ');
}

export function EvidenceDrawer(props: {
  open: boolean;
  onClose: () => void;
  documentId: string | null;
  mentionId?: string | null;
}) {
  const { open, onClose, documentId, mentionId } = props;

  const { document, entities, loading, error } = useDocumentEvidence(documentId);

  const [activeMentionId, setActiveMentionId] = useState<string | null>(() => mentionId ?? null);

  const selectedEntityId = useMemo(() => {
    if (!document) return null;

    const active = activeMentionId ?? null;
    if (active) {
      for (const c of document.chunks ?? []) {
        const hit = (c.mentions ?? []).find((m) => m.id === active) ?? null;
        if (hit) return hit.entityId;
      }
    }

    // Default to the first entity derived from mentions (deterministic, evidence-first).
    return entities[0]?.entity.id ?? null;
  }, [activeMentionId, document, entities]);

  const { rangesByChunkId } = useEntityMentions({ document, entityId: selectedEntityId });

  const title = document?.title ?? 'Evidence inspection';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: 860 }, maxWidth: '100vw' } }}
      aria-label="Evidence drawer"
    >
      <Box sx={{ p: 2, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Read-only evidence inspection (offset-anchored; no confidence; no inference).
            </Typography>
          </Box>
          <IconButton aria-label="Close evidence drawer" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error.message}
          </Alert>
        ) : null}
        {loading ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Loading evidence…
          </Alert>
        ) : null}

        {document ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>{document.title}</strong>
            <div>{provenanceSummary(document)}</div>
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: 2, mt: 2, minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <EvidenceList
              document={document}
              entities={entities}
              activeMentionId={activeMentionId}
              onSelectMention={(id) => {
                setActiveMentionId(id);
              }}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <DocumentTextViewer
              document={document}
              activeEntityId={selectedEntityId}
              rangesByChunkId={rangesByChunkId}
              scrollToMentionId={activeMentionId}
              autoScrollToFirstEvidence
            />
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

