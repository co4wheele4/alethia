'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';

import { AppShell } from '../../components/layout';
import { ClaimComparisonView } from '../../features/claimComparison';

function ClaimComparisonPageInner() {
  const params = useSearchParams();
  const left = params.get('left') ?? '';
  const right = params.get('right') ?? '';

  if (!left || !right) {
    return <Alert severity="info">Select two claims on the Claims page, then open comparison.</Alert>;
  }

  return <ClaimComparisonView leftClaimId={left} rightClaimId={right} />;
}

export default function ClaimComparisonPage() {
  return (
    <AppShell title="Claim comparison">
      <Suspense fallback={null}>
        <ClaimComparisonPageInner />
      </Suspense>
    </AppShell>
  );
}

