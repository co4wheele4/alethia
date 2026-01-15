/**
 * Documents Dashboard Page
 * Dedicated documents view for authenticated users.
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { ContentSurface } from '../components/layout';
import { AppShell } from '../components/shell';
import { DocumentsDashboard } from '../features/documents/components/DocumentsDashboard';

function DocumentsPageInner() {
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const userId = getUserIdFromToken(token);
  const initialIngestOpen = searchParams.get('ingest') === '1' || searchParams.get('ingest') === 'true';
  const initialSelectedId = searchParams.get('documentId');
  const initialChunkIndexRaw = searchParams.get('chunk');
  const initialChunkIndex =
    initialChunkIndexRaw && !Number.isNaN(Number(initialChunkIndexRaw)) ? Number(initialChunkIndexRaw) : null;

  useEffect(() => {
    // Question Workspace gating: user must view documents before asking questions.
    try {
      globalThis.localStorage?.setItem('aletheia.hasViewedDocuments.v1', 'true');
    } catch {
      // Non-fatal (storage blocked).
    }
  }, []);

  return (
    <AppShell title="Documents">
      <ContentSurface>
        <DocumentsDashboard
          userId={userId}
          initialIngestOpen={initialIngestOpen}
          initialSelectedId={initialSelectedId}
          initialChunkIndex={initialChunkIndex}
        />
      </ContentSurface>
    </AppShell>
  );
}

export default function DocumentsPage() {
  // Next.js requires `useSearchParams()` to be used within a Suspense boundary
  // to avoid prerender errors during build.
  return (
    <Suspense fallback={<AppShell title="Documents"><ContentSurface>Loading…</ContentSurface></AppShell>}>
      <DocumentsPageInner />
    </Suspense>
  );
}

