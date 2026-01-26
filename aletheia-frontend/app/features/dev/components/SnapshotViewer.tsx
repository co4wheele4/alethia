/**
 * SnapshotViewer Component
 * UI state snapshot viewer
 */

'use client';

import { Box, Typography, Button } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

export interface SnapshotViewerProps {
  // TODO: Define props
  snapshot?: Record<string, unknown>;
  onTakeSnapshot?: () => void;
}

export function SnapshotViewer(props: SnapshotViewerProps) {
  const { snapshot, onTakeSnapshot } = props;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">State Snapshot (Dev Mode)</Typography>
        {onTakeSnapshot && (
          <Button variant="outlined" size="small" onClick={onTakeSnapshot}>
            Take Snapshot
          </Button>
        )}
      </Box>
      {snapshot ? (
        <Box
          sx={{
            p: 2,
            bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 400,
          }}
        >
          <Typography 
            component="pre" 
            sx={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace' }}
          >
            {JSON.stringify(snapshot, null, 2)}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No snapshot available
        </Typography>
      )}
    </Box>
  );
}
