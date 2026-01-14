/**
 * DocumentsDashboard
 *
 * Documents "library" view with progressive disclosure:
 * - left pane: list + create + delete + filter
 * - right pane: selected document inspection (raw chunks + entity mentions)
 */
'use client';

import { useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';

import { useDocuments } from '../hooks/useDocuments';
import { useDocumentDetails } from '../hooks/useDocumentChunks';
import { DocumentsListPane } from './DocumentsListPane';
import { DocumentDetailsPane } from './DocumentDetailsPane';
import { IngestDocumentsDialog } from './IngestDocumentsDialog';

export function DocumentsDashboard({
  userId,
  initialIngestOpen,
}: {
  userId: string | null;
  initialIngestOpen?: boolean;
}) {
  const { documents, loading, error, isBusy, deleteDocument } = useDocuments(userId);
  const [requestedSelectedId, setRequestedSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [ingestOpen, setIngestOpen] = useState(Boolean(initialIngestOpen));

  const filteredDocuments = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, filter]);

  const selectedId = useMemo(() => {
    if (requestedSelectedId && filteredDocuments.some((d) => d.id === requestedSelectedId)) {
      return requestedSelectedId;
    }
    return filteredDocuments[0]?.id ?? null;
  }, [filteredDocuments, requestedSelectedId]);

  const details = useDocumentDetails(selectedId);

  if (!userId) {
    return (
      <Alert severity="info">
        Documents are available after login. (Unable to determine user id from token.)
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 2 }}>
      <DocumentsListPane
        documents={filteredDocuments}
        allDocumentsCount={documents.length}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={setRequestedSelectedId}
        loading={loading}
        busy={isBusy}
        onDelete={async (id) => {
          await deleteDocument(id);
        }}
        onOpenIngest={() => setIngestOpen(true)}
      />

      <Box>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        ) : null}

        <DocumentDetailsPane
          selectedId={selectedId}
          document={details.document}
          chunks={details.chunks}
          loading={details.loading}
          error={details.error}
        />
      </Box>

      <IngestDocumentsDialog
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        userId={userId}
        onIngested={(documentId) => {
          setRequestedSelectedId(documentId);
          setIngestOpen(false);
        }}
      />
    </Box>
  );
}

