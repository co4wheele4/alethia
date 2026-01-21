/**
 * SourcePopover Component
 * Hover/click to reveal source metadata
 */

'use client';

import { Popover, Typography, Box } from '@mui/material';

export interface SourcePopoverProps {
  // TODO: Define props
  open?: boolean;
  anchorEl?: HTMLElement | null;
  onClose?: () => void;
  source?: {
    origin?: string;
    timestamp?: string;
  };
}

export function SourcePopover(props: SourcePopoverProps) {
  const { open = false, anchorEl, onClose, source } = props;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, minWidth: 200 }}>
        {/* TODO: Implement source metadata display */}
        <Typography variant="subtitle2">Source Information</Typography>
        {source?.origin && <Typography variant="body2">Origin: {source.origin}</Typography>}
        {source?.timestamp && <Typography variant="body2">Time: {source.timestamp}</Typography>}
      </Box>
    </Popover>
  );
}
