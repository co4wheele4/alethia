'use client';

import Link from 'next/link';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { useClaimsForComparison } from '../hooks/useClaimsForComparison';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { ClaimComparisonPanel } from './ClaimComparisonPanel';

function pickTwoById<T extends { id: string }>(items: T[], leftId: string, rightId: string) {
  const left = items.find((c) => c.id === leftId) ?? null;
  const right = items.find((c) => c.id === rightId) ?? null;
  return { left, right };
}

export function ClaimComparisonView(props: { leftClaimId: string; rightClaimId: string }) {
  const { leftClaimId, rightClaimId } = props;

  const { claims, loading, error } = useClaimsForComparison();
  const { left, right } = pickTwoById(claims, leftClaimId, rightClaimId);

  if (!leftClaimId || !rightClaimId) {
    return (
      <Alert severity="info">
        Select two claims to compare from the <Link href="/claims">Claims</Link> page.
      </Alert>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (loading && claims.length === 0) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
        <LadyJusticeProgressIndicator size={18} />
        <Typography variant="body2">Loading comparison data…</Typography>
      </Stack>
    );
  }

  if (!left || !right) {
    return (
      <Alert severity="warning">
        One or both selected claims are not available. Return to <Link href="/claims">Claims</Link> and select two claims
        again.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'baseline' }} sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">Claim comparison</Typography>
          <Typography variant="body2" color="text.secondary">
            Neutral, read-only side-by-side inspection. No conflict, agreement, ranking, or confidence is inferred.
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button component={Link} href="/claims" size="small" sx={{ textTransform: 'none' }}>
          Back to Claims
        </Button>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
        <ClaimComparisonPanel label="A" claim={left} />
        <ClaimComparisonPanel label="B" claim={right} />
      </Box>
    </Box>
  );
}

