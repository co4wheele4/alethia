'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';

import { AppShell } from '../../components/layout';
import { ClaimComparisonView } from '../../features/claimComparison';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken } from '../../features/auth/utils/jwt';

function ClaimComparisonPageInner() {
  const { token, isInitialized } = useAuth();
  const params = useSearchParams();
  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);

  if (!userId) {
    return <Alert severity="info">Claim comparison is available after login.</Alert>;
  }

  const base = params.get('base') ?? '';

  if (!base) {
    return <Alert severity="info">Open claim comparison with /claims/compare?base=&lt;claimId&gt;.</Alert>;
  }

  return <ClaimComparisonView baseClaimId={base} />;
}

export default function ClaimComparisonPage() {
  return (
    <AppShell title="Claim comparison" requireAuth={false}>
      <Suspense fallback={null}>
        <ClaimComparisonPageInner />
      </Suspense>
    </AppShell>
  );
}

