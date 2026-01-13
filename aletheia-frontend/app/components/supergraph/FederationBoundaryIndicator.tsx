/**
 * FederationBoundaryIndicator Component
 * Federation boundary display - invisible to end users, visible in dev/debug mode
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface FederationBoundaryIndicatorProps {
  // TODO: Define props
  boundary?: string;
  visible?: boolean; // Only visible in dev/debug mode
}

export function FederationBoundaryIndicator(props: FederationBoundaryIndicatorProps) {
  const { boundary, visible = false } = props;

  if (!visible) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 1,
        border: 1,
        borderColor: 'info.main',
        borderStyle: 'dashed',
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color="info.main">
        Federation Boundary: {boundary || 'Unknown'}
      </Typography>
    </Box>
  );
}
