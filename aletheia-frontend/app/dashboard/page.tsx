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
import { Box, Button, Divider, Typography } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

import { AppShell } from '../components/layout';

export default function DashboardPage() {
  return (
    <AppShell title="Aletheia">
      <Box
        sx={{
          minHeight: 'calc(100vh - 96px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: 2,
          py: 6,
        }}
      >
        <Box sx={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5">Sources precede conclusions.</Typography>
          <Typography variant="body2" color="text.secondary">
            Start by inspecting documents as immutable evidence. Uncertainty stays visible; nothing is asserted without
            provenance.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Button component={Link} href="/documents" variant="contained" sx={{ textTransform: 'none' }}>
              View documents
            </Button>
            <Button component={Link} href="/documents?ingest=1" variant="outlined" sx={{ textTransform: 'none' }}>
              Add source
            </Button>
            <Button component={Link} href="/onboarding" variant="text" sx={{ textTransform: 'none' }}>
              Onboarding wizard
            </Button>
          </Box>

          <Box
            sx={{
              mt: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              // Match PrimaryNav surface treatment.
              bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
            }}
          >
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="subtitle2" sx={{ letterSpacing: 0.4 }}>
                What Aletheia is
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evidence-first, provenance-forward
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Aletheia is an evidence-first workspace for understanding information at scale without losing the
                original source. It helps you move from “someone said something” to “here is the exact text, where it
                came from, when we ingested it, and how it connects to the rest of what we know.”
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Instead of treating documents as disposable inputs, Aletheia treats them as durable artifacts. Every
                interpretation stays anchored to the underlying material, so you can trace conclusions back to specific
                passages, compare sources, and keep ambiguity visible rather than hidden.
              </Typography>

              <Typography variant="subtitle2" component="h3" gutterBottom sx={{ mt: 3, letterSpacing: 0.4 }}>
                What it’s for
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary' }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Build a clear, navigable record of documents and their provenance (what the source is, and what is
                  known about it).
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Explore entities, relationships, and mentions with explicit attribution to the text that supports
                  them.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Investigate questions with answers that stay tethered to evidence, so readers can verify rather than
                  trust.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Preserve uncertainty as a first-class part of analysis—what is known, what is unknown, and what is
                  disputed are all visible.
                </Typography>
              </Box>

              <Typography variant="subtitle2" component="h3" gutterBottom sx={{ mt: 3, letterSpacing: 0.4 }}>
                Why this matters (value to society)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modern society runs on decisions made from messy information: policy, journalism, science, medicine,
                safety, and public debate. When claims can’t be traced to primary sources, mistakes spread quickly and
                accountability disappears. Aletheia’s purpose is to raise the standard of “show your work” by making
                provenance and evidence easy to inspect. That helps teams and communities reduce misinformation, audit
                important conclusions, and build shared understanding grounded in what documents actually say.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </AppShell>
  );
}
