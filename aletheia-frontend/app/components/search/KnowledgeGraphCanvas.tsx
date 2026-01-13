/**
 * KnowledgeGraphCanvas Component
 * Interactive graph view with click-through to structured detail pages
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface KnowledgeGraphCanvasProps {
  // TODO: Define props
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function KnowledgeGraphCanvas(props: KnowledgeGraphCanvasProps) {
  // Props are available for future use
  // const { onNodeClick, onEdgeClick } = props;

  return (
    <Box
      sx={{
        width: '100%',
        height: 600,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* TODO: Implement interactive graph canvas */}
      <Typography variant="body2" color="text.secondary">
        KnowledgeGraphCanvas - TODO: Implement graph visualization
      </Typography>
    </Box>
  );
}
