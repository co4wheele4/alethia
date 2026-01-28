'use client';

import Link from 'next/link';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';

import type { ReviewRequest, ReviewRequestSource } from '../types';

function sourceLabel(source: ReviewRequestSource) {
  switch (source) {
    case 'COMPARISON':
      return 'Comparison';
    case 'CLAIM_VIEW':
      return 'Claim view';
    default:
      return source;
  }
}

function formatRequestedBy(rr: ReviewRequest) {
  const email = rr.requestedBy?.email ?? '';
  const name = rr.requestedBy?.name ?? '';
  if (name && email) return `${name} (${email})`;
  return email || name || rr.requestedBy?.id || '(unknown user)';
}

function groupBySource(items: ReviewRequest[]) {
  const by: Record<ReviewRequestSource, ReviewRequest[]> = {
    CLAIM_VIEW: [],
    COMPARISON: [],
  };
  for (const rr of items) {
    if (rr.source === 'CLAIM_VIEW' || rr.source === 'COMPARISON') by[rr.source].push(rr);
  }
  return by;
}

export function ReviewerQueueView(props: { items: ReviewRequest[] }) {
  const { items } = props;
  const grouped = groupBySource(items);

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Review requests coordinate attention. They do not change truth or claim status.
      </Alert>

      <Box>
        <Typography variant="h6">Pending review</Typography>
        <Typography variant="body2" color="text.secondary">
          This queue is read-only. Requests are not assignments and do not imply conflict, correctness, or adjudication.
        </Typography>
      </Box>

      <Divider />

      {items.length === 0 ? (
        <Alert severity="warning">No pending review requests.</Alert>
      ) : (
        <Stack spacing={2} aria-label="Pending review queue">
          {(Object.keys(grouped) as ReviewRequestSource[]).map((source) =>
            grouped[source].length ? (
              <Stack key={source} spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {sourceLabel(source)}
                </Typography>

                {grouped[source].map((rr) => (
                  <Box
                    key={rr.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 0 }}>
                        Pending review
                      </Typography>
                      <Chip size="small" color="warning" variant="outlined" label="Review Requested (Not Assigned)" />
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Source: {sourceLabel(rr.source)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Requested by: {formatRequestedBy(rr)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Requested at: {new Date(rr.requestedAt).toISOString()}
                    </Typography>

                    {rr.note ? (
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        Note: {rr.note}
                      </Typography>
                    ) : null}

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                      <Button
                        component={Link}
                        href={`/claims/${encodeURIComponent(rr.claimId)}`}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        View claim
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : null,
          )}
        </Stack>
      )}
    </Stack>
  );
}

