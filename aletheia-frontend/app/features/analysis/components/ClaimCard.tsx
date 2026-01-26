'use client';

import { Box, Divider, Typography } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

import type { AiQueryResult } from '../hooks/useAskAi';
import { ClaimScoreIndicator } from './ClaimScoreIndicator';
import { ClaimEvidenceStack } from './ClaimEvidenceStack';

export interface ClaimCardProps {
  claim: AiQueryResult;
}

export function ClaimCard(props: ClaimCardProps) {
  const { claim } = props;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        AI-generated hypothesis
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5, mb: 1 }}>
        {claim.query.query}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Generated: {new Date(claim.query.createdAt).toLocaleString()}
      </Typography>

      <Typography variant="subtitle2" gutterBottom>
        Output
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {claim.answer}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <ClaimScoreIndicator score={claim.score ?? null} />

      <Divider sx={{ my: 2 }} />

      <ClaimEvidenceStack />
    </Box>
  );
}

