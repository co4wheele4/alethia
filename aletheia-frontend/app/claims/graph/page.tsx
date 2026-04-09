'use client';

import { AppShell } from '../../components/layout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken, getUserRoleFromToken } from '../../features/auth/utils/jwt';
import { ClaimEvidenceGraphView } from '../../features/claimGraph';

export default function ClaimGraphPage() {
  const { token, isInitialized } = useAuth();
  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);
  const userRole = getUserRoleFromToken(stableToken);

  return (
    <AppShell title="Claim–Evidence Graph">
      <ClaimEvidenceGraphView userId={userId} userRole={userRole} />
    </AppShell>
  );
}
