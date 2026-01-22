/**
 * Documents
 *
 * Production route that hosts the existing Documents dashboard UI:
 * - list + filter
 * - ingestion entrypoint
 * - deletion
 * - inspection (chunks + mentions)
 */
'use client';

import { AppShell, ContentSurface } from '../components/layout';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '../features/auth/hooks/useAuth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
import { DocumentsDashboard } from '../features/documents/components/DocumentsDashboard';

function DocumentsPageInner() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  const params = useSearchParams();

  const initialIngestOpen = params.get('ingest') === '1';
  const initialSelectedId = params.get('documentId');
  const initialChunkIndex = (() => {
    const raw = params.get('chunk');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  return (
    <DocumentsDashboard
      userId={userId}
      initialIngestOpen={initialIngestOpen}
      initialSelectedId={initialSelectedId}
      initialChunkIndex={initialChunkIndex}
    />
  );
}

export default function DocumentsPage() {
  return (
    <AppShell title="Documents">
      <ContentSurface>
        <Suspense fallback={null}>
          <DocumentsPageInner />
        </Suspense>
      </ContentSurface>
    </AppShell>
  );
}

