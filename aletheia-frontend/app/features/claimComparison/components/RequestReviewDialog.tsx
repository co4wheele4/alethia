'use client';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import type { RequestReviewError } from '../../reviewerQueue';

/**
 * Request Review dialog.
 *
 * ADR constraints:
 * - Comparison is read-only (ADR-009/010) — this action must not adjudicate or mutate claims.
 * - Review requests coordinate attention only: they do not change truth or claim status.
 */
export function RequestReviewDialog(props: {
  open: boolean;
  claimId: string;
  onClose: () => void;
  onConfirm: (args: { note: string | null }) => void | Promise<void>;
  submitting?: boolean;
  error?: RequestReviewError | null;
}) {
  const { open, claimId, onClose, onConfirm, submitting = false, error = null } = props;
  const [note, setNote] = useState('');

  const noteValue = note.trim() ? note.trim() : null;

  const errorMessage = (() => {
    if (!error) return null;
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'You must be signed in to request review.';
      case 'CLAIM_NOT_FOUND':
        return 'This claim no longer exists or is unavailable.';
      case 'CLAIM_NOT_EVIDENCE_CLOSED':
        return 'This claim is not evidence-closed; review requests are blocked.';
      case 'DUPLICATE_REVIEW_REQUEST':
        return 'You already requested review for this claim.';
      case 'UNEXPECTED_ERROR_CODE':
        return `Unexpected review-request error code (contract mismatch). Received: ${error.received}`;
      case 'NETWORK_OR_UNKNOWN':
        return `Unexpected review-request error (network/unknown). Details: ${error.message}`;
      default:
        return 'Unexpected review-request error.';
    }
  })();

  return (
    <Dialog open={open} onClose={onClose} aria-label="Request review dialog" maxWidth="sm" fullWidth>
      <DialogTitle>Request human review</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.25}>
          <Typography variant="body2">
            Requesting review does not resolve or modify claims. It signals that a human reviewer should inspect this claim in context.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review requests coordinate attention. They do not change truth or claim status.
          </Typography>
          <TextField
            label="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={3}
            helperText="Plain text only. Notes are stored with the review request."
          />
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          <Typography variant="caption" color="text.secondary">
            Target claimId={claimId}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm({ note: noteValue })}
          disabled={submitting}
          variant="contained"
          sx={{ textTransform: 'none' }}
        >
          Request review
        </Button>
      </DialogActions>
    </Dialog>
  );
}

