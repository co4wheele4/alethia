'use client';

import { Box, Typography } from '@mui/material';

import { ScoreMeter } from '../../clarity/components/ScoreMeter';

export interface ClaimScoreIndicatorProps {
  /**
   * Model-provided score (schema field: `AiQueryResult.score`), typically in the 0..1 range.
   */
  score: number | null;
}

export function ClaimScoreIndicator(props: ClaimScoreIndicatorProps) {
  const { score } = props;

  const normalized = score === null ? null : Math.max(0, Math.min(1, score));
  const percent = normalized === null ? null : Math.round(normalized * 100);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Model score
      </Typography>
      <ScoreMeter score={percent ?? undefined} showLabel />
    </Box>
  );
}

