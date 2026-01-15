/**
 * DocumentsDashboard
 *
 * Documents "library" view with progressive disclosure:
 * - left pane: list + create + delete + filter
 * - right pane: selected document inspection (raw chunks + entity mentions)
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';

import { useDocumentsInternal } from '../hooks/useDocuments';
import { useDocumentIndex } from '../hooks/useDocumentIndex';
import { useDocumentDetails } from '../hooks/useDocumentChunks';
import { DocumentsListPane } from './DocumentsListPane';
import { DocumentDetailsPane } from './DocumentDetailsPane';
import { IngestDocumentsDialog } from './IngestDocumentsDialog';
import { useDocumentSourceKindCache } from '../hooks/useDocumentSourceKindCache';
import { parseProvenanceFromChunk0 } from '../provenance';

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
  const index = useDocumentIndex(userId);
  const { deleteDocument, error: mutationError, isBusy } = useDocumentsInternal(userId, { skipList: true });

  const { getKindForDocument, setKindForDocument } = useDocumentSourceKindCache();

  const [requestedSelectedId, setRequestedSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [filter, setFilter] = useState('');
  const [ingestOpen, setIngestOpen] = useState(Boolean(initialIngestOpen));

  const filteredDocuments = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return index.documents;
    return index.documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [index.documents, filter]);

  const selectedId = useMemo(() => {
    if (requestedSelectedId && filteredDocuments.some((d) => d.id === requestedSelectedId)) {
      return requestedSelectedId;
    }
    return filteredDocuments[0]?.id ?? null;
  }, [filteredDocuments, requestedSelectedId]);

  const details = useDocumentDetails(selectedId);

  // Cache source kind after the user has actually opened the document (provenance is stored in chunk 0 content).
  // This avoids inventing a source kind in the Document Index.
  useEffect(() => {
    if (!selectedId) return;
    const chunk0 = details.chunks.find((c) => c.chunkIndex === 0) ?? null;
    if (!chunk0) return;
    const parsed = parseProvenanceFromChunk0(chunk0.content);
    const kindRaw = parsed?.provenance?.source?.kind;
    const kind =
      kindRaw === 'file' || kindRaw === 'url' || kindRaw === 'manual'
        ? (kindRaw as 'file' | 'url' | 'manual')
        : 'unknown';
    if (getKindForDocument(selectedId) !== kind) {
      setKindForDocument(selectedId, kind);
    }
  }, [details.chunks, getKindForDocument, selectedId, setKindForDocument]);

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
        allDocumentsCount={index.documents.length}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={setRequestedSelectedId}
        loading={index.loading}
        busy={isBusy}
        onDelete={async (id) => {
          await deleteDocument(id);
          await index.refetch();
        }}
        onOpenIngest={() => setIngestOpen(true)}
        getSourceKind={(documentId) => getKindForDocument(documentId)}
      />

      <Box>
        {index.error ?? mutationError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(index.error ?? mutationError)!.message}
          </Alert>
        ) : null}

        <DocumentDetailsPane
          selectedId={selectedId}
          document={details.document}
          chunks={details.chunks}
          loading={details.loading}
          error={details.error}
          initialChunkIndex={initialChunkIndex ?? null}
        />
      </Box>

      <IngestDocumentsDialog
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        userId={userId}
        onIngested={(documentId) => {
          setRequestedSelectedId(documentId);
          setIngestOpen(false);
          void index.refetch();
        }}
      />
    </Box>
  );
}

