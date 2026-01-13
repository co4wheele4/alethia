/**
 * DetailDrawer Component
 * Details slide in from side or expand inline
 */

'use client';

import { Drawer, Box } from '@mui/material';

export interface DetailDrawerProps {
  // TODO: Define props
  open?: boolean;
  onClose?: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  children?: React.ReactNode;
}

export function DetailDrawer(props: DetailDrawerProps) {
  const { open = false, onClose, anchor = 'right', children } = props;

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 2 }}>
        {/* TODO: Implement detail drawer */}
        {children || <p>DetailDrawer - TODO: Implement</p>}
      </Box>
    </Drawer>
  );
}
