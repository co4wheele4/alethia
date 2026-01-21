/**
 * SourceBadge Component
 * Small badges next to fields showing source attribution
 */

'use client';

import { Chip } from '@mui/material';

export interface SourceBadgeProps {
  // TODO: Define props
  source?: string;
  confidence?: number;
  onClick?: () => void;
}

export function SourceBadge(props: SourceBadgeProps) {
  const { source, onClick } = props;

  return (
    <Chip
      label={source || 'Source'}
      size="small"
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
