/**
 * DistractionFreeView Component
 * Collapses navigation and chrome - ideal for reading, review, analysis
 */

'use client';

import { Box } from '@mui/material';

export interface DistractionFreeViewProps {
  // TODO: Define props
  children?: React.ReactNode;
  enabled?: boolean;
}

export function DistractionFreeView(props: DistractionFreeViewProps) {
  const { children, enabled = false } = props;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        overflow: 'auto',
        ...(enabled && {
          // Hide navigation and chrome when enabled
          '& nav, & header, & footer': {
            display: 'none',
          },
        }),
      }}
    >
      {children}
    </Box>
  );
}
