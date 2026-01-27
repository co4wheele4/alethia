'use client';

import Link from 'next/link';
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
import { useClaimReview } from '../hooks/useClaimReview';

export function ClaimReviewView(props: { claimId: string }) {
  const { claimId } = props;
  const [note, setNote] = useState('');

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
    if (!adjudication.available) return adjudication.reason;
    if (isTerminal) return 'Claim is in a terminal state.';
    return null;
  }, [adjudication, claim, contractError, evidenceCount, isTerminal]);

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

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Claim type
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              Blocked: claim type is not exposed by the current GraphQL schema, so the UI cannot render it.
            </Alert>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Review actions (human judgment)
            </Typography>

            {actionsBlockedReason ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {actionsBlockedReason}
              </Alert>
            ) : null}

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              <Button
                variant="contained"
                disabled={Boolean(actionsBlockedReason) || !canTransition('ACCEPTED')}
                onClick={() => requestTransition('ACCEPTED', noteValue)}
              >
                Accept claim
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={Boolean(actionsBlockedReason) || !canTransition('REJECTED')}
                onClick={() => requestTransition('REJECTED', noteValue)}
              >
                Reject claim
              </Button>
              <Button
                variant="outlined"
                disabled
                onClick={() => requestTransition('REVIEWED', noteValue)}
              >
                Flag for further review (not supported)
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Lifecycle transitions are schema-enforced. Allowed next:{' '}
              {allowedNext.length ? allowedNext.join(', ') : '(none)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Note: the schema uses <code>REVIEWED</code> (not <code>REVIEW</code>) and does not expose a
              conflicted/flagged state.
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
              helperText="Plain text only. Notes cannot be persisted until the backend exposes reviewer-note fields."
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

