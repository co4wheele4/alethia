'use client';

import { Alert, Stack } from '@mui/material';

import { AppShell } from '../components/layout';
import { ReviewerQueueView, useReviewQueue } from '../features/reviewerQueue';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getAuthToken } from '../features/auth/utils/auth';
import { getUserIdFromToken, getUserRoleFromToken } from '../features/auth/utils/jwt';

function ReviewQueuePageInner() {
  const { token, isInitialized } = useAuth();
  const { items, loading, error, refetch } = useReviewQueue();

  const stableToken = token ?? getAuthToken();
  const currentUserId = getUserIdFromToken(stableToken);
  const currentUserRole = getUserRoleFromToken(stableToken);

  if (!isInitialized) return null;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error.message}</Alert> : null}
      {loading && items.length === 0 ? <Alert severity="info">Loading review queue…</Alert> : null}
      <ReviewerQueueView
        items={items}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onRefetch={refetch}
      />
    </Stack>
  );
}

export default function ReviewQueuePage() {
  return (
    <AppShell title="Review queue" requireAuth>
      <ReviewQueuePageInner />
    </AppShell>
  );
}

