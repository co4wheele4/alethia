/**
 * TruthStateIndicator Component
 * Visual indicator for truth states
 */

'use client';

import { Chip } from '@mui/material';

export type TruthState = 'known' | 'inferred' | 'user-provided' | 'unverified' | 'error';

export interface TruthStateIndicatorProps {
  // TODO: Define props
  state?: TruthState;
}

const stateColors: Record<TruthState, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  'known': 'success',
  'inferred': 'primary',
  'user-provided': 'default',
  'unverified': 'warning',
  'error': 'error',
};

export function TruthStateIndicator(props: TruthStateIndicatorProps) {
  const { state = 'unverified' } = props;

  return (
    <Chip
      label={state}
      color={stateColors[state]}
      size="small"
    />
  );
}
