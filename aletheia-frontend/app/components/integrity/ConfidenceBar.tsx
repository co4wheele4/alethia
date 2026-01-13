/**
 * ConfidenceBar Component
 * Visualized confidence on AI or derived values
 * Never hidden or auto-collapsed
 */

'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export interface ConfidenceBarProps {
  // TODO: Define props
  confidence?: number; // 0-100
  label?: string;
}

export function ConfidenceBar(props: ConfidenceBarProps) {
  const { confidence = 0, label } = props;

  return (
    <Box>
      {/* TODO: Implement confidence bar - never hidden */}
      {label && (
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      )}
      <LinearProgress
        variant="determinate"
        value={confidence}
        sx={{ mt: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {confidence}%
      </Typography>
    </Box>
  );
}
