'use client';

import { AppShell } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getUserIdFromToken } from '../features/auth/utils/jwt';
import { EvidenceExplorer } from '../features/evidence/components/EvidenceExplorer';

export default function EvidencePage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  return (
    <AppShell title="Evidence">
      <EvidenceExplorer userId={userId} />
    </AppShell>
  );
}

