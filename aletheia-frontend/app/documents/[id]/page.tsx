/**
 * Document Detail (read-only).
 *
 * Shows:
 * - provenance (source summary)
 * - chunked text (raw + offset-based mention highlights)
 * - entities (derived from mentions)
 * - relationships with explicit evidence anchors
 */
'use client';

import { use } from 'react';

import { AppShell, ContentSurface } from '../../components/layout';
import { DocumentDetailPanel } from '../../features/documents/components/DocumentDetailPanel';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell title="Document">
      <ContentSurface>
        <DocumentDetailPanel documentId={id} initialChunkIndex={null} />
      </ContentSurface>
    </AppShell>
  );
}

