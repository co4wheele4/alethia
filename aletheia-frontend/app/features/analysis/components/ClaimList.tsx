'use client';

import { Box, Typography } from '@mui/material';

import type { AiQueryResult } from '../hooks/useAskAi';
import { ClaimCard } from './ClaimCard';

export interface ClaimListProps {
  claims: AiQueryResult[];
}

export function ClaimList(props: ClaimListProps) {
  const { claims } = props;

  if (claims.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No AI outputs yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {claims.map((c) => (
        <ClaimCard key={c.id} claim={c} />
      ))}
    </Box>
  );
}

