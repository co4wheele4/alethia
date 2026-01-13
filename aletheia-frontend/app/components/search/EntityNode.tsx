/**
 * EntityNode Component
 * Entity node in knowledge graph
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface EntityNodeProps {
  // TODO: Define props
  entityId?: string;
  label?: string;
  onClick?: () => void;
}

export function EntityNode(props: EntityNodeProps) {
  const { entityId, label, onClick } = props;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: 'action.hover' } : {},
      }}
    >
      <Typography variant="body2">{label || entityId || 'Entity'}</Typography>
    </Box>
  );
}
