'use client';

import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material';

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;

  return (
    <Box sx={{ p: 4, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Application error
      </Typography>
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>What happened</AlertTitle>
        {error.message}
        {error.digest ? (
          <Typography variant="caption" component="div" sx={{ mt: 1 }}>
            Digest: {error.digest}
          </Typography>
        ) : null}
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aletheia favors explicit failure over silent corruption. Try again; if the problem persists, inspect network
        calls and GraphQL errors.
      </Typography>
      <Button variant="contained" onClick={reset} sx={{ textTransform: 'none' }}>
        Retry
      </Button>
    </Box>
  );
}

