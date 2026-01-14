/**
 * Overview Page
 *
 * This is not a “dashboard”. It is an entrypoint to the epistemic instrument.
 * We foreground immutable sources (Documents) and make uncertainty explicit.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Typography, Alert } from '@mui/material';

import { ChangePasswordForm } from '../components/ui/ChangePasswordForm';
import { ContentSurface } from '../components/layout';
import { AppShell } from '../components/shell';
import { DocumentsPanel } from '../components/dashboard/DocumentsPanel';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { token } = useAuth();

  return (
    <AppShell
      title="Overview"
      headerActions={
        <Button color="inherit" onClick={() => setChangePasswordOpen(true)} sx={{ textTransform: 'none' }}>
          Change password
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info">
          This system shows what is known, what is inferred, and what is unknown. AI outputs are never treated as
          facts unless evidence is shown.
        </Alert>

        <ContentSurface>
          <DocumentsPanel userId={getUserIdFromToken(token)} />
        </ContentSurface>

        <ContentSurface>
          <Typography variant="subtitle1" gutterBottom>
            Next steps
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Use these views to inspect evidence without altering sources.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button component={Link} href="/documents" variant="outlined" sx={{ textTransform: 'none' }}>
              Documents (sources)
            </Button>
            <Button component={Link} href="/evidence" variant="outlined" sx={{ textTransform: 'none' }}>
              Evidence (chunks)
            </Button>
            <Button component={Link} href="/entities" variant="outlined" sx={{ textTransform: 'none' }}>
              Entities (extracted)
            </Button>
            <Button component={Link} href="/analysis" variant="outlined" sx={{ textTransform: 'none' }}>
              Analysis (AI outputs)
            </Button>
            <Button component={Link} href="/provenance" variant="outlined" sx={{ textTransform: 'none' }}>
              Provenance (audit)
            </Button>
          </Box>
        </ContentSurface>

        <ChangePasswordForm
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={() => {
            // No implicit side effects; caller can decide what to do.
          }}
        />
      </Box>
    </AppShell>
  );
}
