'use client';

import Link from 'next/link';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';

import type { ReviewerQueueItem } from '../types';

function sourceLabel(source: ReviewerQueueItem['source']) {
  switch (source) {
    case 'comparison':
      return 'Comparison';
    case 'manual':
      return 'Manual request';
    default:
      return 'Manual request';
  }
}

export function ReviewerQueueView(props: { items: ReviewerQueueItem[] }) {
  const { items } = props;

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Reviewer queues are a coordination aid. They do not change claim status or truth.
      </Alert>

      <Box>
        <Typography variant="h6">Pending review</Typography>
        <Typography variant="body2" color="text.secondary">
          This is a UI-only stub: items are not assigned, not persisted, and do not imply conflict or correctness.
        </Typography>
      </Box>

      <Divider />

      {items.length === 0 ? (
        <Alert severity="warning">No pending review requests in this session.</Alert>
      ) : (
        <Stack spacing={1.25} aria-label="Pending review queue">
          {items.map((item) => (
            <Box
              key={item.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 0 }}>
                  Pending review
                </Typography>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label="Review Requested (Not Yet Assigned)"
                />
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Source: {sourceLabel(item.source)}
              </Typography>

              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {item.claimText}
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                <Button
                  component={Link}
                  href={`/claims/${encodeURIComponent(item.claimId)}`}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  View claim
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

