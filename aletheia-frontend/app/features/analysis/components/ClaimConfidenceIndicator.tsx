'use client';

import { Box, Typography } from '@mui/material';

import { ConfidenceMeter } from '../../clarity/components/ConfidenceMeter';

export interface ClaimConfidenceIndicatorProps {
  /**
   * Backend currently returns `score` for AI results. This is not calibrated confidence.
   * We display it as a model score and keep uncertainty explicit.
   */
  score: number | null;
}

export function ClaimConfidenceIndicator(props: ClaimConfidenceIndicatorProps) {
  const { score } = props;

  const normalized = score === null ? null : Math.max(0, Math.min(1, score));
  const percent = normalized === null ? null : Math.round(normalized * 100);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Model score (not calibrated confidence)
      </Typography>
      <ConfidenceMeter confidence={percent ?? undefined} showLabel />
    </Box>
  );
}

