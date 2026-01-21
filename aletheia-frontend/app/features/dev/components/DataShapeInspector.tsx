/**
 * DataShapeInspector Component
 * Data structure inspector
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface DataShapeInspectorProps {
  // TODO: Define props
  data?: unknown;
  shape?: Record<string, string>;
}

export function DataShapeInspector(props: DataShapeInspectorProps) {
  const { data, shape } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Shape Inspector (Dev Mode)
      </Typography>
      {shape && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Expected Shape:
          </Typography>
          <Typography 
            component="pre" 
            sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
          >
            {JSON.stringify(shape, null, 2)}
          </Typography>
        </Box>
      )}
      {data != null && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Actual Data:
          </Typography>
          <Typography 
            component="pre" 
            sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
          >
            {typeof data === 'string' ? data : JSON.stringify(data as Record<string, unknown>, null, 2)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
