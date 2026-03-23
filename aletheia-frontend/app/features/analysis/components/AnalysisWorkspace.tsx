'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useAskAi, type AiQueryResult } from '../hooks/useAskAi';
import { useAiQueriesByUser } from '../hooks/useAiQueriesByUser';
import { ClaimList } from './ClaimList';

export function AnalysisWorkspace(props: { userId: string | null }) {
  const { userId } = props;
  const [prompt, setPrompt] = useState('');
  const [sessionClaims, setSessionClaims] = useState<AiQueryResult[]>([]);

  const { ask, loading: askLoading, error: askError } = useAskAi();
  const history = useAiQueriesByUser(userId);
  const docs = useDocuments(userId);

  const historicalClaims = useMemo(() => {
    const all: AiQueryResult[] = [];
    for (const q of history.queries) {
      for (const r of q.results ?? []) {
        all.push({
          __typename: 'AiQueryResult',
          id: r.id,
          answer: r.answer,
          query: {
            __typename: 'AiQuery',
            id: q.id,
            query: q.query,
            createdAt: q.createdAt,
          },
        });
      }
    }
    return all.sort((a, b) => b.query.createdAt.localeCompare(a.query.createdAt));
  }, [history.queries]);

  if (!userId) {
    return <Alert severity="info">Analysis workspace is available after login.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Analysis workspace
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ask questions and inspect AI outputs as hypotheses. If evidence is missing, the UI will say so explicitly.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          The backend does not yet return citations linking AI output to specific document chunks. Until that exists,
          AI output cannot be promoted to “claim with evidence”.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Scope (explicit)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Scope selection is visible here, but is not yet enforced by the backend API. This is shown to prevent
          hidden context.
        </Typography>

        {docs.loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading documents…</Typography>
          </Box>
        ) : null}

        {!docs.loading && docs.documents.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No documents available. Ingest sources first to build an evidence base.
          </Alert>
        ) : null}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Question (explicit prompt)
        </Typography>
        <TextField
          label="Ask a question"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          minRows={3}
          multiline
          fullWidth
          placeholder="State a question or hypothesis. Avoid hidden assumptions. Prefer pointing at evidence."
          sx={{ mb: 2 }}
        />

        {askError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {askError.message}
          </Alert>
        ) : null}

        <Button
          variant="contained"
          disabled={askLoading || prompt.trim().length === 0}
          onClick={async () => {
            const q = prompt.trim();
            const res = await ask(userId, q);
            if (res) {
              setSessionClaims((prev) => [res, ...prev]);
              setPrompt('');
            }
          }}
          sx={{ textTransform: 'none' }}
        >
          {askLoading ? 'Asking…' : 'Ask'}
        </Button>
      </ContentSurface>

      <ContentSurface>
        <Typography variant="subtitle1" gutterBottom>
          Session output
        </Typography>
        <ClaimList claims={sessionClaims} />
      </ContentSurface>

      <ContentSurface>
        <Typography variant="subtitle1" gutterBottom>
          History
        </Typography>
        {history.error ? <Alert severity="error">{history.error.message}</Alert> : null}
        <ClaimList claims={historicalClaims} />
      </ContentSurface>
    </Box>
  );
}

