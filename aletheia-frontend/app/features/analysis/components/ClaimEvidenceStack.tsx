'use client';

import { Alert, Box, Typography } from '@mui/material';

/**
 * ClaimEvidenceStack — placeholder for claims without resolvable evidence (ADR-020).
 * ADR-020 §5: If a claim has no evidence, UI MUST explicitly state this; MUST NOT simulate or imply evidence.
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

