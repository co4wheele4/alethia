/**
 * SnapshotViewer Component
 * UI state snapshot viewer
 */

'use client';

import { Box, Typography, Button } from '@mui/material';

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
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 400,
          }}
        >
          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No snapshot available
        </Typography>
      )}
    </Box>
  );
}
