'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

import type { IngestProgress } from '../hooks/useIngestDocuments';

export interface IngestionStatusStepperProps {
  progress: IngestProgress;
}

export function IngestionStatusStepper(props: IngestionStatusStepperProps) {
  const { progress } = props;

  if (progress.state === 'idle') {
    return (
      <Typography variant="body2" color="text.secondary">
        Ready.
      </Typography>
    );
  }

  if (progress.state === 'error') {
    return (
      <Typography variant="body2" color="error">
        {progress.message}
      </Typography>
    );
  }

  if (progress.state === 'done') {
    return (
      <Typography variant="body2" color="text.secondary">
        Done. Created {progress.chunksCreated} chunk(s).
      </Typography>
    );
  }

  const pct =
    progress.total > 0 ? Math.round((Math.min(progress.current, progress.total) / progress.total) * 100) : 0;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {progress.step} ({progress.current}/{progress.total})
      </Typography>
      <LinearProgress variant="determinate" value={pct} />
    </Box>
  );
}

