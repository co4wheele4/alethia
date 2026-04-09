'use client';

import { AppShell } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getAuthToken } from '../features/auth/utils/auth';
import { getUserIdFromToken, getUserRoleFromToken } from '../features/auth/utils/jwt';
import { DocumentsEvidenceLayout } from '../features/evidence/components/DocumentsEvidenceLayout';

export default function EvidencePage() {
  const { token, isInitialized } = useAuth();
  if (!isInitialized) return null;
  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);
  const userRole = getUserRoleFromToken(stableToken);

  return (
    <AppShell title="Evidence">
      <DocumentsEvidenceLayout userId={userId} userRole={userRole} />
    </AppShell>
  );
}

