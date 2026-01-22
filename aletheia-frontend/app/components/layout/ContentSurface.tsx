/**
 * ContentSurface Component
 * Content container with minimalist styling
 */

'use client';

import { Box } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

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
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
        borderRadius: 1,
        boxShadow: elevation > 0 ? elevation : 'none',
      }}
    >
      {children}
    </Box>
  );
}
