'use client';

import { Alert, Box, Typography } from '@mui/material';

/**
 * ClaimEvidenceStack
 *
 * Placeholder until the backend returns explicit citations (documentId + chunkIndex).
 * We refuse to fabricate evidence links.
 */
export function ClaimEvidenceStack() {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Supporting evidence
      </Typography>
      <Alert severity="warning">
        Evidence linkage is not available from the API yet. This AI output must be treated as a hypothesis until it
        can cite specific chunks.
      </Alert>
    </Box>
  );
}

