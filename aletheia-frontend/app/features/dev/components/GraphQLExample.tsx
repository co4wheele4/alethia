/**
 * Example component demonstrating GraphQL queries
 */

'use client';

import { useHello } from '../hooks/useHello';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';

export function GraphQLExample() {
  const { hello, loading, error, refetch } = useHello();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LadyJusticeProgressIndicator size={20} />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error.message}
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          GraphQL Query Result:
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {hello || 'No data'}
        </Typography>
      </Paper>
      <Button variant="contained" onClick={() => refetch()}>
        Refetch
      </Button>
    </Box>
  );
}
