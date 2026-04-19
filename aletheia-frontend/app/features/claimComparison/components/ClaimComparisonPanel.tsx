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
  reviewActivityCount?: number;
  onOpenReviewActivity?: () => void;
}) {
  const { onRequestReview, requestReviewDisabled, modeCaption, reviewActivityCount, onOpenReviewActivity } = props;

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'baseline' }} sx={{ mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6">Claim comparison</Typography>
        <Typography variant="body2" color="text.secondary">
          Neutral, read-only side-by-side inspection. No conflict, agreement, ranking, or confidence is inferred
          (ADR-010, ADR-038).
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {modeCaption ?? 'Related claims are derived client-side from schema fields only (shared document IDs and evidence-linked entity IDs).'}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          onClick={onOpenReviewActivity}
          disabled={!onOpenReviewActivity}
          variant="outlined"
          size="small"
          aria-label={
            typeof reviewActivityCount === 'number' ? `Review activity (${reviewActivityCount})` : 'Review activity'
          }
          sx={{ textTransform: 'none' }}
        >
          Review activity{typeof reviewActivityCount === 'number' ? ` (${reviewActivityCount})` : ''}
        </Button>
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

