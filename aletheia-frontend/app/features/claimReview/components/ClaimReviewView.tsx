'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { ClaimStatusBadge } from '../../claims/components/ClaimStatusBadge';
import { useRequestReview } from '../../reviewerQueue';
import { useClaimReview } from '../hooks/useClaimReview';

function adjudicationErrorMessage(code: string) {
  switch (code) {
    case 'UNAUTHORIZED_REVIEWER':
      return 'You must be signed in to review claims.';
    case 'CLAIM_NOT_FOUND':
      return 'This claim no longer exists or is unavailable.';
    case 'INVALID_LIFECYCLE_TRANSITION':
      return 'This claim can no longer be modified.';
    case 'UNEXPECTED_ERROR_CODE':
      return 'Unexpected adjudication error code (contract mismatch).';
    case 'NETWORK_OR_UNKNOWN':
      return 'Unexpected adjudication error (network/unknown).';
    default:
      return 'Unexpected adjudication error (unknown).';
  }
}

function requestReviewErrorMessage(code: string) {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'You must be signed in to request review.';
    case 'CLAIM_NOT_FOUND':
      return 'This claim no longer exists or is unavailable.';
    case 'DUPLICATE_REVIEW_REQUEST':
      return 'You already requested review for this claim.';
    case 'UNEXPECTED_ERROR_CODE':
      return 'Unexpected review-request error code (contract mismatch).';
    case 'NETWORK_OR_UNKNOWN':
      return 'Unexpected review-request error (network/unknown).';
    default:
      return 'Unexpected review-request error (unknown).';
  }
}

export function ClaimReviewView(props: { claimId: string }) {
  const { claimId } = props;
  const [note, setNote] = useState('');
  const router = useRouter();
  const requestReview = useRequestReview();

  const {
    claim,
    claimsLoading,
    claimsError,
    evidenceItems,
    evidenceLoading,
    evidenceError,
    contractError,
    allowedNext,
    canTransition,
    adjudication,
    requestTransition,
  } = useClaimReview(claimId);

  const isTerminal = claim?.status === 'ACCEPTED' || claim?.status === 'REJECTED';

  const evidenceCount = evidenceItems.length;
  const actionsBlockedReason = useMemo(() => {
    if (!claim) return 'Missing claim.';
    if (contractError) return contractError.message;
    if (evidenceCount === 0) return 'No evidence resolved; adjudication is blocked.';
    return null;
  }, [claim, contractError, evidenceCount]);

  const noteValue = note.trim() ? note.trim() : null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <ContentSurface>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6">Claim</Typography>
          {claim ? <ClaimStatusBadge status={claim.status} testId="claim-state" /> : null}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Claims are assertions grounded in explicit evidence. No confidence is shown.
        </Typography>

        {claimsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading claim…</Typography>
          </Box>
        ) : null}

        {claimsError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {claimsError.message}
          </Alert>
        ) : null}

        {!claimsLoading && !claimsError && !claim ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            Claim not found: {claimId}
          </Alert>
        ) : null}

        {claim ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Claim text
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
              data-testid="claim-text"
            >
              {claim.text}
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                sx={{ textTransform: 'none' }}
                disabled={requestReview.loading}
                onClick={async () => {
                  try {
                    await requestReview.requestReview({
                      claimId,
                      source: 'CLAIM_VIEW',
                      note: null,
                    });
                    router.push('/review-queue');
                  } catch {
                    // error is rendered below via requestReview.error
                  }
                }}
                startIcon={requestReview.loading ? <LadyJusticeProgressIndicator size={18} /> : undefined}
              >
                Request review
              </Button>
            </Stack>

            {requestReview.error ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {requestReviewErrorMessage(requestReview.error.code)}
                {'received' in requestReview.error && requestReview.error.code === 'UNEXPECTED_ERROR_CODE'
                  ? ` Received: ${requestReview.error.received}`
                  : null}
                {'message' in requestReview.error && requestReview.error.code === 'NETWORK_OR_UNKNOWN'
                  ? ` Details: ${requestReview.error.message}`
                  : null}
              </Alert>
            ) : null}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Review actions (human judgment)
            </Typography>

            {actionsBlockedReason ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {actionsBlockedReason}
              </Alert>
            ) : null}

            {isTerminal ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                This claim can no longer be modified.
              </Alert>
            ) : null}

            {adjudication.error ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {adjudicationErrorMessage(adjudication.error.code)}
                {'received' in adjudication.error && adjudication.error.code === 'UNEXPECTED_ERROR_CODE'
                  ? ` Received: ${adjudication.error.received}`
                  : null}
                {'message' in adjudication.error && adjudication.error.code === 'NETWORK_OR_UNKNOWN'
                  ? ` Details: ${adjudication.error.message}`
                  : null}
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              <Button
                variant="contained"
                disabled={
                  Boolean(actionsBlockedReason) ||
                  adjudication.loading ||
                  isTerminal ||
                  !canTransition('ACCEPTED')
                }
                onClick={() => requestTransition('ACCEPTED', noteValue)}
                startIcon={adjudication.loading ? <LadyJusticeProgressIndicator size={18} /> : undefined}
              >
                Accept claim
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={
                  Boolean(actionsBlockedReason) ||
                  adjudication.loading ||
                  isTerminal ||
                  !canTransition('REJECTED')
                }
                onClick={() => requestTransition('REJECTED', noteValue)}
                startIcon={adjudication.loading ? <LadyJusticeProgressIndicator size={18} /> : undefined}
              >
                Reject claim
              </Button>
              <Button
                variant="outlined"
                disabled={
                  Boolean(actionsBlockedReason) ||
                  adjudication.loading ||
                  isTerminal ||
                  !canTransition('REVIEWED')
                }
                onClick={() => requestTransition('REVIEWED', noteValue)}
              >
                Mark reviewed
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Lifecycle transitions are schema-enforced. Allowed next:{' '}
              {allowedNext.length ? allowedNext.join(', ') : '(none)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Note: mutation input uses <code>REVIEW</code> to transition to persisted <code>REVIEWED</code>.
            </Typography>

            <TextField
              label="Reviewer note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              size="small"
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 2 }}
              helperText="Plain text only. Notes are persisted with the adjudication action."
            />
          </>
        ) : null}
      </ContentSurface>

      <ContentSurface>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">Evidence</Typography>
            <Typography variant="body2" color="text.secondary">
              Read-only grounding snippets (offset-based) with explicit document linkage.
            </Typography>
          </Box>
          <Chip size="small" variant="outlined" label={`${evidenceCount} item${evidenceCount === 1 ? '' : 's'}`} />
        </Stack>

        {evidenceLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading evidence…</Typography>
          </Box>
        ) : null}

        {evidenceError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {evidenceError.message}
          </Alert>
        ) : null}

        {contractError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            Contract violation: {contractError.message}
          </Alert>
        ) : null}

        {!evidenceLoading && !evidenceError ? (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {evidenceItems.map((item) => (
              <Box
                key={`${item.kind}:${item.evidenceId}:${item.kind === 'mention' ? item.mentionId : item.relationshipId}:${item.startOffset}:${item.endOffset}`}
                data-testid="evidence-item"
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 0 }}>
                    <Link
                      href={`/documents/${encodeURIComponent(item.documentId)}`}
                      style={{ textDecoration: 'none' }}
                      data-testid="evidence-document-title"
                    >
                      {item.documentTitle}
                    </Link>
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={item.kind === 'mention' ? `mention:${item.mentionId}` : `relationship:${item.relationshipId}`}
                  />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {item.sourceLabel ? `Source: ${item.sourceLabel} • ` : ''}
                  Chunk {item.chunkIndex} • offsets [{item.startOffset}, {item.endOffset})
                </Typography>

                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', mt: 1, mb: 0 }}
                  data-testid="evidence-snippet"
                >
                  {item.snippet}
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  <Button
                    component={Link}
                    href={item.jumpHref}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Jump to source
                  </Button>
                  {item.kind === 'mention' && item.entityName ? (
                    <Chip size="small" variant="outlined" label={`entity: ${item.entityName}`} />
                  ) : null}
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : null}
      </ContentSurface>
    </Box>
  );
}

