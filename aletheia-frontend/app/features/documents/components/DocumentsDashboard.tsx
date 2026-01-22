/**
 * DocumentsDashboard
 *
 * Documents "library" view with progressive disclosure:
 * - left pane: list + create + delete + filter
 * - right pane: selected document inspection (raw chunks + entity mentions)
 */
'use client';

import { useState } from 'react';
import { Alert, Box } from '@mui/material';

import { DocumentsListPane } from './DocumentsListPane';
import { DocumentDetailsPane } from './DocumentDetailsPane';
import { IngestDocumentsDialog } from './IngestDocumentsDialog';
import { DocumentIndexQueryContainer } from './DocumentIndexQueryContainer';
import { DeleteDocumentMutationContainer } from './DeleteDocumentMutationContainer';

export function DocumentsDashboard({
  userId,
  initialIngestOpen,
  initialSelectedId,
  initialChunkIndex,
}: {
  userId: string | null;
  initialIngestOpen?: boolean;
  initialSelectedId?: string | null;
  initialChunkIndex?: number | null;
}) {
  const [requestedSelectedId, setRequestedSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [filter, setFilter] = useState('');
  const [ingestOpen, setIngestOpen] = useState(Boolean(initialIngestOpen));

  if (!userId) {
    return (
      <Alert severity="info">
        Documents are available after login. (Unable to determine user id from token.)
      </Alert>
    );
  }

  return (
    <DeleteDocumentMutationContainer>
      {({ deleteDocument, busy: deleteBusy, error: deleteError }) => (
        <DocumentIndexQueryContainer userId={userId}>
          {({ documents, loading: indexLoading, error: indexError, refetch }) => {
            const filteredDocuments = (() => {
              const q = filter.trim().toLowerCase();
              if (!q) return documents;
              return documents.filter((d) => d.title.toLowerCase().includes(q));
            })();

            const selectedId = (() => {
              if (requestedSelectedId && filteredDocuments.some((d) => d.id === requestedSelectedId)) {
                return requestedSelectedId;
              }
              return filteredDocuments[0]?.id ?? null;
            })();

            return (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 2 }}>
                <DocumentsListPane
                  documents={filteredDocuments}
                  allDocumentsCount={documents.length}
                  filter={filter}
                  onFilterChange={setFilter}
                  selectedId={selectedId}
                  onSelect={setRequestedSelectedId}
                  loading={indexLoading}
                  busy={deleteBusy}
                  onDelete={async (id) => {
                    await deleteDocument(id);
                    await refetch();
                  }}
                  onOpenIngest={() => setIngestOpen(true)}
                />

                <Box>
                  {indexError ?? deleteError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {(indexError ?? deleteError)!.message}
                    </Alert>
                  ) : null}

                  <DocumentDetailsPane selectedId={selectedId} initialChunkIndex={initialChunkIndex ?? null} />
                </Box>

                <IngestDocumentsDialog
                  open={ingestOpen}
                  onClose={() => setIngestOpen(false)}
                  userId={userId}
                  onIngested={(documentId) => {
                    setRequestedSelectedId(documentId);
                    setIngestOpen(false);
                    void refetch();
                  }}
                />
              </Box>
            );
          }}
        </DocumentIndexQueryContainer>
      )}
    </DeleteDocumentMutationContainer>
  );
}

