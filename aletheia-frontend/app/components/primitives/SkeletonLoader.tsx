/**
 * Skeleton Loader Component
 * Renders consistently on both server and client to prevent hydration mismatches
 * Used to handle timing issues with Emotion style injection
 * 
 * IMPORTANT: This component must render identically on server and client.
 * All MUI components use Emotion, which injects styles. The key is ensuring
 * the same styles are injected in the same order on both sides.
 */

'use client';

import { Box, Skeleton, Typography } from '@mui/material';
import { LadyJusticeProgressIndicator } from './LadyJusticeProgressIndicator';

export function SkeletonLoader() {
  // This component renders the EXACT same structure on server and client
  // No conditional logic, no client-only code, no state
  // All MUI components will use the same Emotion cache from the theme provider
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
      suppressHydrationWarning
    >
      <LadyJusticeProgressIndicator size={56} suppressHydrationWarning />
      <Skeleton variant="text" width={200} height={32} suppressHydrationWarning />
      <Skeleton variant="text" width={150} height={24} suppressHydrationWarning />
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mt: 2 }}
        suppressHydrationWarning
      >
        Loading...
      </Typography>
    </Box>
  );
}
