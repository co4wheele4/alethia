/**
 * BeforeAfterView Component
 * Visual diffs highlighted
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface BeforeAfterViewProps {
  // TODO: Define props
  before?: string;
  after?: string;
}

export function BeforeAfterView(props: BeforeAfterViewProps) {
  const { before, after } = props;

  return (
    <Box>
      {/* TODO: Implement before/after view with visual diffs */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', opacity: 0.3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Before
        </Typography>
        <Typography variant="body2">{before || 'No content'}</Typography>
      </Box>
      <Box sx={{ p: 2, bgcolor: 'success.light', opacity: 0.3 }}>
        <Typography variant="subtitle2" gutterBottom>
          After
        </Typography>
        <Typography variant="body2">{after || 'No content'}</Typography>
      </Box>
    </Box>
  );
}
