'use client';

import { AppShell } from '../components/shell';
import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
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

