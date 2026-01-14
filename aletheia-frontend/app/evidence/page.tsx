'use client';

import { AppShell } from '../components/shell';
import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { EvidencePanel } from '../features/evidence/components/EvidencePanel';

export default function EvidencePage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  return (
    <AppShell title="Evidence">
      <EvidencePanel userId={userId} />
    </AppShell>
  );
}

