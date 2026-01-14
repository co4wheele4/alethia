'use client';

import { IngestDocumentsDialog } from './IngestDocumentsDialog';

/**
 * AddSourceModal
 *
 * Alias wrapper around `IngestDocumentsDialog` to match the ingestion component inventory.
 * Sources are ingested into immutable Documents + Chunks.
 */
export function AddSourceModal(props: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onIngested: (documentId: string) => void;
}) {
  return <IngestDocumentsDialog {...props} />;
}

