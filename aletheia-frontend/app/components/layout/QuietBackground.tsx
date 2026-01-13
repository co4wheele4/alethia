/**
 * QuietBackground Component
 * Minimal background styling - contrast reserved for meaning
 */

'use client';

import { Box } from '@mui/material';

export interface QuietBackgroundProps {
  // TODO: Define props
  children?: React.ReactNode;
}

export function QuietBackground(props: QuietBackgroundProps) {
  const { children } = props;

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '100%',
      }}
    >
      {children}
    </Box>
  );
}
