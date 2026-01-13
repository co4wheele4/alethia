/**
 * TradeoffCallout Component
 * Lists consequences before action - no surprise side effects
 */

'use client';

import { Alert, AlertTitle, Typography, Box } from '@mui/material';

export interface Tradeoff {
  benefit: string;
  cost: string;
}

export interface TradeoffCalloutProps {
  // TODO: Define props
  tradeoffs?: Tradeoff[];
  title?: string;
}

export function TradeoffCallout(props: TradeoffCalloutProps) {
  const { tradeoffs = [], title = 'Consider the tradeoffs' } = props;

  return (
    <Alert severity="info">
      <AlertTitle>{title}</AlertTitle>
      {tradeoffs.length === 0 && <Typography>TODO: Implement tradeoff display</Typography>}
      {tradeoffs.map((tradeoff, index) => (
        <Box key={index} sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Benefit:</strong> {tradeoff.benefit}
          </Typography>
          <Typography variant="body2">
            <strong>Cost:</strong> {tradeoff.cost}
          </Typography>
        </Box>
      ))}
    </Alert>
  );
}
