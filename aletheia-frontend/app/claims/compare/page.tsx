'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';

import { AppShell } from '../../components/layout';
import { ClaimComparisonView } from '../../features/claimComparison';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken, getUserRoleFromToken } from '../../features/auth/utils/jwt';

function parseWithClaimIds(params: ReturnType<typeof useSearchParams>) {
  // ADR-005: schema-faithful routing only; treat query params as opaque IDs (no inference).
  const raw = params.getAll('with').flatMap((v) => String(v ?? '').split(','));
  const ids = raw.map((v) => v.trim()).filter(Boolean);
  return Array.from(new Set(ids));
}

function ClaimComparisonPageInner() {
  const { token, isInitialized } = useAuth();
  const params = useSearchParams();
  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);
  const userRole = getUserRoleFromToken(stableToken);

  if (!userId) {
    return <Alert severity="info">Claim comparison is available after login.</Alert>;
  }

  const base = params.get('base') ?? '';
  const withClaimIds = parseWithClaimIds(params).filter((id) => id !== base);

  if (!base) {
    return <Alert severity="info">Open claim comparison with /claims/compare?base=&lt;claimId&gt;.</Alert>;
  }

  return <ClaimComparisonView baseClaimId={base} withClaimIds={withClaimIds} userRole={userRole} />;
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

