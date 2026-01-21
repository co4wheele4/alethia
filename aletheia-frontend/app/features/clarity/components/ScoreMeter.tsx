'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export interface ScoreMeterProps {
  /**
   * 0-100. If omitted, the score is shown as unknown.
   */
  score?: number | null;
  showLabel?: boolean;
}

export function ScoreMeter(props: ScoreMeterProps) {
  const { score, showLabel = true } = props;
  const isKnown = typeof score === 'number' && Number.isFinite(score);
  const clamped = isKnown ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <Box>
      {showLabel && (
        <Typography variant="caption" color="text.secondary">
          {isKnown ? `Score: ${Math.round(clamped)}%` : 'Score: unknown'}
        </Typography>
      )}
      <LinearProgress variant="determinate" value={clamped} sx={{ mt: 1 }} />
    </Box>
  );
}

