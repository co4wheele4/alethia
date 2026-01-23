'use client';

import { ListItemButton, ListItemText, Stack, Typography } from '@mui/material';

import type { Claim } from '../hooks/useClaims';
import { ClaimStatusBadge } from './ClaimStatusBadge';

export function ClaimListItem(props: {
  claim: Claim;
  selected: boolean;
  onSelect: (claimId: string) => void;
}) {
  const { claim, selected, onSelect } = props;

  return (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(claim.id)}
      sx={{ borderRadius: 1, alignItems: 'flex-start' }}
    >
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

