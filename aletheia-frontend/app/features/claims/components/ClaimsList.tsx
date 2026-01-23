'use client';

import { Alert, List, Typography } from '@mui/material';

import type { Claim } from '../hooks/useClaims';
import { ClaimListItem } from './ClaimListItem';

export function ClaimsList(props: {
  claims: Claim[];
  selectedClaimId: string | null;
  onSelectClaim: (claimId: string) => void;
  comparisonClaimIds: string[];
  onToggleComparisonClaim: (claimId: string) => void;
}) {
  const { claims, selectedClaimId, onSelectClaim, comparisonClaimIds, onToggleComparisonClaim } = props;

  if (claims.length === 0) {
    return <Alert severity="info">No claims found for this scope.</Alert>;
  }

  return (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Claims
      </Typography>
      <List dense aria-label="claims-list">
        {claims.map((c) => (
          <ClaimListItem
            key={c.id}
            claim={c}
            selected={c.id === selectedClaimId}
            onSelect={onSelectClaim}
            comparisonSelected={comparisonClaimIds.includes(c.id)}
            onToggleComparison={onToggleComparisonClaim}
          />
        ))}
      </List>
    </>
  );
}

