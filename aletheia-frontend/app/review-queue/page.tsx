'use client';

import { Alert, Stack } from '@mui/material';

import { AppShell } from '../components/layout';
import { ReviewerQueueView, useReviewQueue } from '../features/reviewerQueue';

function ReviewQueuePageInner() {
  const { items, loading, error } = useReviewQueue();

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error.message}</Alert> : null}
      {loading && items.length === 0 ? <Alert severity="info">Loading review queue…</Alert> : null}
      <ReviewerQueueView items={items} />
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

