/**
 * ServiceOwnershipBadge Component
 * Service ownership indicator - invisible to end users, visible in dev/debug mode
 */

'use client';

import { Chip } from '@mui/material';

export interface ServiceOwnershipBadgeProps {
  // TODO: Define props
  serviceName?: string;
  visible?: boolean; // Only visible in dev/debug mode
}

export function ServiceOwnershipBadge(props: ServiceOwnershipBadgeProps) {
  const { serviceName, visible = false } = props;

  if (!visible) {
    return null;
  }

  return (
    <Chip
      label={serviceName ? `Service: ${serviceName}` : 'Service'}
      size="small"
      color="info"
    />
  );
}
