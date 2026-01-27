'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Alert } from '@mui/material';

import { AppShell } from '../../components/layout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken } from '../../features/auth/utils/jwt';
import { ClaimReviewView } from '../../features/claimReview/components/ClaimReviewView';

function ClaimReviewPageInner() {
  const params = useParams<{ claimId?: string }>();
  const claimId = String(params?.claimId ?? '');

  const { token, isInitialized } = useAuth();

  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);

  if (!userId) {
    return <Alert severity="info">Claim review is available after login.</Alert>;
  }

  if (!claimId) {
    return <Alert severity="error">Missing claim id.</Alert>;
  }

  return <ClaimReviewView claimId={claimId} />;
}

export default function ClaimReviewPage() {
  return (
    <AppShell title="Claim review" requireAuth={false}>
      <Suspense fallback={null}>
        <ClaimReviewPageInner />
      </Suspense>
    </AppShell>
  );
}

