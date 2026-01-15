 'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box sx={{ p: 4, maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Not found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This route does not exist. No assumptions have been made about what you intended.
      </Typography>
      <Link href="/dashboard" passHref legacyBehavior>
        <Button component="a" variant="outlined" sx={{ textTransform: 'none' }}>
          Go to overview
        </Button>
      </Link>
    </Box>
  );
}

