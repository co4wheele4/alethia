'use client';

import { Stack, Typography } from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { ImmutableRecordBadge } from '../../integrity/components/ImmutableRecordBadge';
import { ClaimStatusBadge } from '../../claims/components/ClaimStatusBadge';
import type { ClaimComparisonClaim } from '../hooks/useClaimsForComparison';

export function ClaimCard(props: { label: 'A' | 'B'; claim: ClaimComparisonClaim }) {
  const { label, claim } = props;

  return (
    <ContentSurface>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Claim {label}
        </Typography>
        <ImmutableRecordBadge label="Read-only" />
        <ClaimStatusBadge status={claim.status} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Created: {new Date(claim.createdAt).toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
        {claim.text}
      </Typography>
    </ContentSurface>
  );
}

