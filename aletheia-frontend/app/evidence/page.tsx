'use client';

import { AppShell } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getAuthToken } from '../features/auth/utils/auth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
import { EvidenceExplorer } from '../features/evidence/components/EvidenceExplorer';

export default function EvidencePage() {
  const { token, isInitialized } = useAuth();
  if (!isInitialized) return null;
  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);

  return (
    <AppShell title="Evidence">
      <EvidenceExplorer userId={userId} />
    </AppShell>
  );
}

