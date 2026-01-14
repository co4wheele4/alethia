/**
 * Documents Dashboard Page
 * Dedicated documents view for authenticated users.
 */
'use client';

import { useSearchParams } from 'next/navigation';

import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { ContentSurface } from '../components/layout';
import { AppShell } from '../components/shell';
import { DocumentsDashboard } from '../features/documents/components/DocumentsDashboard';

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const userId = getUserIdFromToken(token);
  const initialIngestOpen = searchParams.get('ingest') === '1' || searchParams.get('ingest') === 'true';

  return (
    <AppShell title="Documents">
      <ContentSurface>
        <DocumentsDashboard userId={userId} initialIngestOpen={initialIngestOpen} />
      </ContentSurface>
    </AppShell>
  );
}

