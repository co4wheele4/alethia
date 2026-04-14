/**
 * Relationships (read-only skeleton).
 *
 * Phase constraint: inspection only.
 */
'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { Alert, Box, LinearProgress, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { WorkspaceEmptyHelp } from '../components/common/WorkspaceEmptyHelp';
import { AppShell, ContentSurface } from '../components/layout';
import { LIST_RELATIONSHIPS_QUERY } from '@/src/graphql';

type Relationship = {
  id: string;
  relation: string;
  from: { id: string; name: string; type: string };
  to: { id: string; name: string; type: string };
  evidence: Array<{
    id: string;
    kind: string;
    startOffset: number | null;
    endOffset: number | null;
    chunk: { id: string; chunkIndex: number; document: { id: string; title: string; sourceLabel: string | null } };
  }>;
};

type ListRelationshipsResult = { entityRelationships: Relationship[] };

export default function RelationshipsPage() {
  const { data, loading, error } = useQuery<ListRelationshipsResult>(LIST_RELATIONSHIPS_QUERY);
  const relationships = data?.entityRelationships ?? [];

  return (
    <AppShell title="Relationships">
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Relationships
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Relationships are only usable when they are backed by inspectable evidence anchors.
        </Typography>

        {loading ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Loading relationships…
            </Typography>
            <LinearProgress />
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        ) : null}

        {!loading && !error && relationships.length === 0 ? (
          <WorkspaceEmptyHelp surface="relationships" />
        ) : null}

        {!loading && !error && relationships.length > 0 ? (
          <List dense aria-label="relationships-list">
            {relationships.map((r) => {
              const ev = r.evidence[0];
              const evLabel = ev
                ? `Evidence: ${ev.kind} • chunk ${ev.chunk.chunkIndex} • offsets [${String(ev.startOffset)}, ${String(
                    ev.endOffset
                  )})`
                : 'Evidence: none';

              const docLabel = ev
                ? `Doc: ${ev.chunk.document.title} • ${ev.chunk.document.sourceLabel ?? 'unknown'}`
                : 'Doc: unknown';

              return (
                <ListItemButton key={r.id} sx={{ borderRadius: 1, mb: 0.5 }}>
                  <ListItemText
                    primary={`${r.from.name} (${r.from.type}) —[${r.relation}]→ ${r.to.name} (${r.to.type})`}
                    secondary={[evLabel, docLabel].join('\n')}
                  />
                  {ev ? (
                    <Typography variant="caption" component={Link} href={`/documents/${ev.chunk.document.id}`}>
                      View document
                    </Typography>
                  ) : null}
                </ListItemButton>
              );
            })}
          </List>
        ) : null}
      </ContentSurface>
    </AppShell>
  );
}

