/**
 * Documents Index (read-only).
 *
 * Phase constraint: no creation, no ingestion, no deletion. This route exists to answer:
 * "What data exists and where did it come from?"
 */
'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { Alert, Box, LinearProgress, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { AppShell, ContentSurface } from '../components/layout';
import { LIST_DOCUMENTS_QUERY } from '@/src/graphql';

type ListDocumentsResult = {
  documents: Array<{
    id: string;
    title: string;
    createdAt: string;
    sourceType: string | null;
    sourceLabel: string | null;
    source: { requestedUrl?: string | null; fetchedUrl?: string | null; filename?: string | null } | null;
    chunks: Array<{ id: string }>;
  }>;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function statusOf(d: ListDocumentsResult['documents'][number]) {
  if (!d.source) return 'UNSOURCED';
  if (d.chunks.length === 0) return 'EMPTY';
  return 'READY';
}

export default function DocumentsPage() {
  const { data, loading, error } = useQuery<ListDocumentsResult>(LIST_DOCUMENTS_QUERY);
  const documents = data?.documents ?? [];

  return (
    <AppShell title="Documents">
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Browse ingested documents and inspect provenance. This is a read-only trust surface.
        </Typography>

        {loading ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Loading documents…
            </Typography>
            <LinearProgress />
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        ) : null}

        {!loading && !error && documents.length === 0 ? (
          <Alert severity="info">No documents found.</Alert>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <List dense aria-label="documents-list">
            {documents
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((d) => {
                const provenanceHint =
                  d.source?.requestedUrl ?? d.source?.fetchedUrl ?? d.source?.filename ?? d.sourceLabel ?? 'unknown';
                return (
                  <ListItemButton
                    key={d.id}
                    component={Link}
                    href={`/documents/${d.id}`}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={d.title}
                      secondary={[
                        `Source: ${d.sourceType ?? 'UNKNOWN'} • ${provenanceHint}`,
                        `Created: ${formatDate(d.createdAt)} • Status: ${statusOf(d)} • Chunks: ${d.chunks.length}`,
                      ].join('\n')}
                    />
                  </ListItemButton>
                );
              })}
          </List>
        ) : null}
      </ContentSurface>
    </AppShell>
  );
}

