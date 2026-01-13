/**
 * ImmutableRecordBadge Component
 * Locked styling for immutable records
 */

'use client';

import { Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export interface ImmutableRecordBadgeProps {
  // TODO: Define props
  label?: string;
}

export function ImmutableRecordBadge(props: ImmutableRecordBadgeProps) {
  const { label = 'Immutable' } = props;

  return (
    <Chip
      icon={<LockIcon />}
      label={label}
      size="small"
      color="default"
      sx={{ opacity: 0.7 }}
    />
  );
}
