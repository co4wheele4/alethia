/**
 * SystemStatusPanel Component
 * System status and health display
 */

'use client';

import { Box, Typography, Chip } from '@mui/material';

export type SystemStatus = 'healthy' | 'degraded' | 'down';

export interface SystemStatusPanelProps {
  // TODO: Define props
  status?: SystemStatus;
  message?: string;
}

const statusColors: Record<SystemStatus, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'error',
};

export function SystemStatusPanel(props: SystemStatusPanelProps) {
  const { status = 'healthy', message } = props;

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2">System Status</Typography>
        <Chip label={status} color={statusColors[status]} size="small" />
      </Box>
      {message && <Typography variant="body2">{message}</Typography>}
    </Box>
  );
}
