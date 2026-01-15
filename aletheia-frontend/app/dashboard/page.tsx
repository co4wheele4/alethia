/**
 * Overview Page
 *
 * Entry experience (authenticated):
 * Minimal, calm landing with two primary actions:
 * - View Documents
 * - Add Source
 *
 * No “Ask AI” entry point.
 */

'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

import { AppShell } from '../components/shell';

export default function DashboardPage() {
  return (
    <AppShell title="Aletheia">
      <Box
        sx={{
          minHeight: 'calc(100vh - 96px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5">Sources precede conclusions.</Typography>
          <Typography variant="body2" color="text.secondary">
            Start by inspecting documents as immutable evidence. Uncertainty stays visible; nothing is asserted without
            provenance.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Link href="/documents" passHref legacyBehavior>
              <Button component="a" variant="contained" sx={{ textTransform: 'none' }}>
                View documents
              </Button>
            </Link>
            <Link href="/documents?ingest=1" passHref legacyBehavior>
              <Button component="a" variant="outlined" sx={{ textTransform: 'none' }}>
                Add source
              </Button>
            </Link>
          </Box>
        </Box>
      </Box>
    </AppShell>
  );
}
