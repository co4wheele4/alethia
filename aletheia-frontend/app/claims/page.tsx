'use client';

import { AppShell } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getAuthToken } from '../features/auth/utils/auth';
import { getUserIdFromToken, getUserRoleFromToken } from '../features/auth/utils/jwt';
import { ClaimsView } from '../features/claims';

export default function ClaimsPage() {
  const { token, isInitialized } = useAuth();
  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);
  const userRole = getUserRoleFromToken(stableToken);

  return (
    <AppShell title="Claims">
      <ClaimsView userId={userId} userRole={userRole} />
    </AppShell>
  );
}

