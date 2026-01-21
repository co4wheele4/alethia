/**
 * SideBySideCompare Component
 * Synchronized scrolling comparison
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface SideBySideCompareProps {
  // TODO: Define props
  leftTitle?: string;
  rightTitle?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function SideBySideCompare(props: SideBySideCompareProps) {
  const { leftTitle = 'Before', rightTitle = 'After', leftContent, rightContent } = props;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {leftTitle}
        </Typography>
        <Box sx={{ border: 1, borderColor: 'divider', p: 2, minHeight: 200 }}>
          {leftContent || <Typography>TODO: Implement left content</Typography>}
        </Box>
      </Box>
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {rightTitle}
        </Typography>
        <Box sx={{ border: 1, borderColor: 'divider', p: 2, minHeight: 200 }}>
          {rightContent || <Typography>TODO: Implement right content</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
