'use client';

import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';

/**
 * Comparison header panel + actions.
 *
 * ADR-010: comparison remains a neutral, read-only inspection surface.
 * ADR-011: request review is navigational (no mutation / no lifecycle change).
 */
export function ClaimComparisonPanel(props: {
  onRequestReview: () => void;
  requestReviewDisabled?: boolean;
  modeCaption?: string;
}) {
  const { onRequestReview, requestReviewDisabled, modeCaption } = props;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'baseline' }} sx={{ mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6">Claim comparison</Typography>
        <Typography variant="body2" color="text.secondary">
          Neutral, read-only side-by-side inspection. No conflict, agreement, ranking, or confidence is inferred.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {modeCaption ?? 'Related claims are derived client-side from schema fields only (shared document IDs and evidence-linked entity IDs).'}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          onClick={onRequestReview}
          disabled={Boolean(requestReviewDisabled)}
          variant="contained"
          size="small"
          aria-label="Request review"
          sx={{ textTransform: 'none' }}
        >
          Request review
        </Button>
        <Button component={Link} href="/claims" size="small" sx={{ textTransform: 'none' }}>
          Back to Claims
        </Button>
      </Stack>
    </Stack>
  );
}

