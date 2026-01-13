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
          <pre style={{ fontSize: '0.875rem' }}>{JSON.stringify(shape, null, 2)}</pre>
        </Box>
      )}
      {data && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Actual Data:
          </Typography>
          <pre style={{ fontSize: '0.875rem' }}>
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
}
