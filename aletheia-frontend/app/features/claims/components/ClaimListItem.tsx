'use client';

import { Checkbox, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';

import type { Claim } from '../hooks/useClaims';
import { ClaimStatusBadge } from './ClaimStatusBadge';

export function ClaimListItem(props: {
  claim: Claim;
  selected: boolean;
  onSelect: (claimId: string) => void;
  comparisonSelected: boolean;
  onToggleComparison: (claimId: string) => void;
}) {
  const { claim, selected, onSelect, comparisonSelected, onToggleComparison } = props;

  return (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(claim.id)}
      sx={{ borderRadius: 1, alignItems: 'flex-start' }}
    >
      <Checkbox
        edge="start"
        checked={comparisonSelected}
        tabIndex={-1}
        disableRipple
        inputProps={{ 'aria-label': `Select claim ${claim.id} for comparison` }}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleComparison(claim.id)}
        sx={{ mt: 0.25, mr: 1 }}
      />
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <ClaimStatusBadge status={claim.status} />
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              Claim
            </Typography>
          </Stack>
        }
        secondary={
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {claim.text}
          </Typography>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
    </ListItemButton>
  );
}

