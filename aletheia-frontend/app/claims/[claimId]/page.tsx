'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';

import { AppShell } from '../../components/layout';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getAuthToken } from '../../features/auth/utils/auth';
import { getUserIdFromToken } from '../../features/auth/utils/jwt';
import { ClaimReviewView } from '../../features/claimReview/components/ClaimReviewView';

type FixtureClaimStatus = 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

function sliceByOffsets(content: string, start: number, end: number) {
  if (start < 0 || end <= start || end > content.length) return '';
  return content.slice(start, end);
}

function FixtureClaimReviewView() {
  const [status, setStatus] = React.useState<FixtureClaimStatus>('REVIEWED');

  const documentTitle = 'Fixture document (claim-review-001)';
  const content =
    'The reviewer can accept this claim because its evidence points to a concrete text span in a document.';
  const startOffset = 4;
  const endOffset = 42;
  const snippet = sliceByOffsets(content, startOffset, endOffset);

  const evidencePresent = Boolean(snippet) && Boolean(documentTitle);
  const isTerminal = status === 'ACCEPTED' || status === 'REJECTED';
  const actionsDisabled = !evidencePresent || isTerminal;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h6">Claim</Typography>
          <Chip
            size="small"
            variant="outlined"
            color={status === 'ACCEPTED' ? 'success' : status === 'REJECTED' ? 'error' : 'info'}
            label={status === 'REVIEWED' ? 'Reviewed' : status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
            data-testid="claim-state"
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Fixture mode: evidence-grounded review UI. No confidence is shown.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Claim text
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }} data-testid="claim-text">
          Reviewer can accept the claim with explicit evidence.
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Review actions (human judgment)
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          <Button
            variant="contained"
            disabled={actionsDisabled}
            onClick={() => {
              if (!evidencePresent) return;
              setStatus('ACCEPTED');
            }}
          >
            Accept
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionsDisabled}
            onClick={() => {
              if (!evidencePresent) return;
              setStatus('REJECTED');
            }}
          >
            Reject
          </Button>
          <Button variant="outlined" disabled>
            Flag
          </Button>
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">Evidence</Typography>
            <Typography variant="body2" color="text.secondary">
              Offset-derived snippet with explicit document linkage.
            </Typography>
          </Box>
          <Chip size="small" variant="outlined" label="1 item" />
        </Stack>

        <Box
          data-testid="evidence-item"
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mt: 2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} data-testid="evidence-document-title">
            {documentTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            offsets [{startOffset}, {endOffset})
          </Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', mt: 1, mb: 0 }}
            data-testid="evidence-snippet"
          >
            {snippet}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ClaimReviewPageInner() {
  const params = useParams<{ claimId?: string }>();
  const claimId = String(params?.claimId ?? '');

  const { token, isInitialized } = useAuth();

  // Deterministic E2E acceptance fixture (no MSW required).
  if (process.env.NEXT_PUBLIC_E2E_FIXTURES === 'enabled' && claimId === 'claim-review-001') {
    return <FixtureClaimReviewView />;
  }

  if (!isInitialized) return null;

  const stableToken = token ?? getAuthToken();
  const userId = getUserIdFromToken(stableToken);

  if (!userId) {
    return <Alert severity="info">Claim review is available after login.</Alert>;
  }

  if (!claimId) {
    return <Alert severity="error">Missing claim id.</Alert>;
  }

  return <ClaimReviewView claimId={claimId} />;
}

export default function ClaimReviewPage() {
  return (
    <AppShell title="Claim review" requireAuth={false}>
      <Suspense fallback={null}>
        <ClaimReviewPageInner />
      </Suspense>
    </AppShell>
  );
}

