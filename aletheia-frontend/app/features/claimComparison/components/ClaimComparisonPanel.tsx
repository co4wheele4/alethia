'use client';

import { Box, Stack } from '@mui/material';

import type { ClaimComparisonClaim } from '../hooks/useClaimsForComparison';
import { ClaimCard } from './ClaimCard';
import { ClaimEvidenceList } from './ClaimEvidenceList';

export function ClaimComparisonPanel(props: { label: 'A' | 'B'; claim: ClaimComparisonClaim }) {
  const { label, claim } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <ClaimCard label={label} claim={claim} />
      <Stack spacing={2}>
        <ClaimEvidenceList claim={claim} />
      </Stack>
    </Box>
  );
}

