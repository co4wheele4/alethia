'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

/**
 * Request Review dialog.
 *
 * ADR constraints:
 * - Comparison is read-only (ADR-009/010) — this action is *navigational + explanatory* only.
 * - No claim lifecycle transitions are triggered here (ADR-011); users must explicitly adjudicate on the claim review page if schema permits.
 */
export function RequestReviewDialog(props: {
  open: boolean;
  claimId: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, claimId, onClose, onConfirm } = props;

  return (
    <Dialog open={open} onClose={onClose} aria-label="Request review dialog" maxWidth="sm" fullWidth>
      <DialogTitle>Request human review</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.25}>
          <Typography variant="body2">
            Requesting review does not resolve or modify claims. It signals that a human reviewer should inspect this claim in context.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This does not adjudicate claims, and no data is persisted. You will be taken to the claim review page where evidence is visible and adjudication is
            only possible if the current GraphQL schema explicitly allows it.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Target claimId={claimId}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" sx={{ textTransform: 'none' }}>
          Go to claim review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

