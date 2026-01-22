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

import { AppShell } from '../components/layout';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '../features/auth/hooks/useAuth';
import { getAuthToken } from '../features/auth/utils/auth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
import { DocumentsDashboard } from '../features/documents/components/DocumentsDashboard';

function DocumentsPageInner() {
  const { token, isInitialized } = useAuth();
  const params = useSearchParams();
  if (!isInitialized) return null;
  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);

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
      <Suspense fallback={null}>
        <DocumentsPageInner />
      </Suspense>
    </AppShell>
  );
}

