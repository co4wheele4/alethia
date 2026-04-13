'use client';

import { Alert, Box, Typography } from '@mui/material';

import { ContentSurface } from '../components/layout';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * MVP: AI / inference workspace is disabled. Route kept for stable URLs with explicit messaging.
 */
export default function AnalysisPage() {
  const { isAuthenticated } = useAuth();

  return (
    <ContentSurface>
      <Typography variant="h5" gutterBottom>
        Analysis workspace (disabled for MVP)
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Aletheia MVP does not expose automated inference, embeddings, or semantic extraction. Claims are
        statements—not facts. Evidence is stored and rendered as submitted or fetched. The system does not
        score, rank, or infer correctness. Adjudication is explicit and human.
      </Alert>
      {isAuthenticated ? (
        <Box>
          <Typography variant="body2" color="text.secondary">
            You are signed in. No analysis or Q&amp;A endpoints are available in this build.
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Sign in to use the rest of the application. This page remains disabled for MVP.
        </Typography>
      )}
    </ContentSurface>
  );
}
