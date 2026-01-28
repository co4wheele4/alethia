'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stack, Button } from '@mui/material';

import { AppShell } from '../components/layout';
import { parseReviewerQueueSeedFromSearchParams, ReviewerQueueView, useReviewerQueue } from '../features/reviewerQueue';

function ReviewQueuePageInner() {
  const params = useSearchParams();
  const { items, enqueue, clear } = useReviewerQueue();

  useEffect(() => {
    const seed = parseReviewerQueueSeedFromSearchParams(new URLSearchParams(params?.toString() ?? ''));
    if (seed.length) enqueue(seed);
  }, [enqueue, params]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end">
        <Button onClick={clear} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
          Clear queue (session only)
        </Button>
      </Stack>
      <ReviewerQueueView items={items} />
    </Stack>
  );
}

export default function ReviewQueuePage() {
  return (
    <AppShell title="Review queue" requireAuth={false}>
      <Suspense fallback={null}>
        <ReviewQueuePageInner />
      </Suspense>
    </AppShell>
  );
}

