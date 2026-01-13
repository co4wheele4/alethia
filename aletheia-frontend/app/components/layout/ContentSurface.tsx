/**
 * ContentSurface Component
 * Content container with minimalist styling
 */

'use client';

import { Box } from '@mui/material';

export interface ContentSurfaceProps {
  // TODO: Define props
  children?: React.ReactNode;
  elevation?: number;
}

export function ContentSurface(props: ContentSurfaceProps) {
  const { children, elevation = 0 } = props;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: elevation > 0 ? elevation : 'none',
      }}
    >
      {children}
    </Box>
  );
}
