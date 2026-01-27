'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Alert, Box } from '@mui/material';

import { AppShell } from '../../components/layout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken } from '../../features/auth/utils/jwt';
import { ClaimReviewView } from '../../features/claimReview/components/ClaimReviewView';

function ClaimReviewPageInner() {
  const params = useParams<{ claimId?: string }>();
  const searchParams = useSearchParams();
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

  const isReviewRequestFromComparison =
    searchParams.get('reviewRequest') === '1' && searchParams.get('from') === 'compare';

  return (
    <Box>
      {isReviewRequestFromComparison ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Requesting review does not resolve or modify claims. It signals that a human reviewer should inspect this claim in context.
          <br />
          No data is persisted by requesting review; any adjudication must be an explicit, schema-allowed action.
        </Alert>
      ) : null}
      <ClaimReviewView claimId={claimId} />
    </Box>
  );
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

