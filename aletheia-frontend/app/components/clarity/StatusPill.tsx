/**
 * StatusPill Component
 * Status display component
 */

'use client';

import { Chip } from '@mui/material';

export interface StatusPillProps {
  // TODO: Define props
  status?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export function StatusPill(props: StatusPillProps) {
  const { status = 'Unknown', color = 'default' } = props;

  return (
    <Chip
      label={status}
      color={color}
      size="small"
    />
  );
}
