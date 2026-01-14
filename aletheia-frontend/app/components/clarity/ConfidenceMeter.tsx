/**
 * ConfidenceMeter Component
 * Confidence / score visualization.
 *
 * IMPORTANT:
 * If confidence is missing, we show it as unknown (we do not fabricate).
 */

'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export interface ConfidenceMeterProps {
  /**
   * 0-100. If omitted, confidence is shown as unknown.
   */
  confidence?: number | null;
  showLabel?: boolean;
}

export function ConfidenceMeter(props: ConfidenceMeterProps) {
  const { confidence, showLabel = true } = props;
  const isKnown = typeof confidence === 'number' && Number.isFinite(confidence);
  const clamped = isKnown ? Math.max(0, Math.min(100, confidence)) : 0;

  return (
    <Box>
      {showLabel && (
        <Typography variant="caption" color="text.secondary">
          {isKnown ? `Confidence/score: ${Math.round(clamped)}%` : 'Confidence/score: unknown'}
        </Typography>
      )}
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{ mt: 1 }}
      />
    </Box>
  );
}
