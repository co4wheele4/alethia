/**
 * DiffViewer Component
 * Inline diffs for text changes
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface DiffViewerProps {
  // TODO: Define props
  oldText?: string;
  newText?: string;
}

export function DiffViewer(props: DiffViewerProps) {
  const { oldText, newText } = props;

  return (
    <Box>
      {/* TODO: Implement diff viewer */}
      <Typography variant="body2" sx={{ color: 'error.main' }}>
        - {oldText || 'Old text'}
      </Typography>
      <Typography variant="body2" sx={{ color: 'success.main' }}>
        + {newText || 'New text'}
      </Typography>
    </Box>
  );
}
