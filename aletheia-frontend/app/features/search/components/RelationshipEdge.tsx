/**
 * RelationshipEdge Component
 * Relationship edge in knowledge graph
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface RelationshipEdgeProps {
  // TODO: Define props
  fromId?: string;
  toId?: string;
  label?: string;
  onClick?: () => void;
}

export function RelationshipEdge(props: RelationshipEdgeProps) {
  const { fromId, toId, label, onClick } = props;

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* TODO: Implement relationship edge visualization */}
      <Typography variant="caption">
        {fromId} → {toId} {label && `(${label})`}
      </Typography>
    </Box>
  );
}
