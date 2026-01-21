/**
 * AttributionFooter Component
 * Includes timestamp, origin, and confidence for source attribution
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface AttributionFooterProps {
  // TODO: Define props
  timestamp?: string;
  origin?: string;
  confidence?: number;
}

export function AttributionFooter(props: AttributionFooterProps) {
  const { timestamp, origin, confidence } = props;

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      {/* TODO: Implement attribution footer */}
      <Typography variant="caption" color="text.secondary">
        {timestamp && `Updated: ${timestamp}`}
        {origin && ` | Source: ${origin}`}
        {confidence !== undefined && ` | Confidence: ${confidence}%`}
        {!timestamp && !origin && !confidence && 'AttributionFooter - TODO: Implement'}
      </Typography>
    </Box>
  );
}
