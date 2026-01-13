/**
 * ConfidenceMeter Component
 * Confidence visualization
 */

'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export interface ConfidenceMeterProps {
  // TODO: Define props
  confidence?: number; // 0-100
  showLabel?: boolean;
}

export function ConfidenceMeter(props: ConfidenceMeterProps) {
  const { confidence = 0, showLabel = true } = props;

  return (
    <Box>
      {/* TODO: Implement confidence meter */}
      {showLabel && (
        <Typography variant="caption" color="text.secondary">
          Confidence: {confidence}%
        </Typography>
      )}
      <LinearProgress
        variant="determinate"
        value={confidence}
        sx={{ mt: 1 }}
      />
    </Box>
  );
}
