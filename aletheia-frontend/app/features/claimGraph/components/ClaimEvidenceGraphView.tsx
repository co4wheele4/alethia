/**
 * ADR-021: Read-only claim–evidence graph view.
 *
 * Fetches claims + evidence, transforms to nodes/edges only.
 * No inference, no derived metrics, no semantic emphasis.
 */

'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useClaimGraphData } from '../hooks/useClaimGraphData';
import { GraphRenderer } from './GraphRenderer';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';

function evidenceHref(
  _evidenceId: string,
  docId?: string | null,
  chunkId?: string | null
): string {
  if (docId) {
    const base = `/documents/${encodeURIComponent(docId)}`;
    return chunkId ? `${base}?chunkId=${encodeURIComponent(chunkId)}` : base;
  }
  return '/evidence';
}

export function ClaimEvidenceGraphView(props: { userId: string | null }) {
  const { userId } = props;
  const [scopeDocumentId, setScopeDocumentId] = useState<string>('__all__');
  const activeDocumentId = useMemo(
    () => (scopeDocumentId === '__all__' ? null : scopeDocumentId),
    [scopeDocumentId]
  );

  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);
  const { data, evidenceMeta, loading, error } = useClaimGraphData(activeDocumentId);

  if (!userId) {
    return <Alert severity="info">Graph view is available after login.</Alert>;
  }

  return (
    <ContentSurface>
      <Typography variant="h6" gutterBottom>
        Claim–Evidence Graph
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Read-only topology. Only explicit Claim → Evidence edges from persisted ClaimEvidence links.
        No inferred relationships; shared evidence does not imply meaning.
      </Typography>

      {docsError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {docsError.message}
        </Alert>
      ) : null}

      <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
        <InputLabel id="graph-scope-label">Scope</InputLabel>
        <Select
          labelId="graph-scope-label"
          label="Scope"
          value={scopeDocumentId}
          onChange={(e) => setScopeDocumentId(String(e.target.value))}
          aria-label="graph-scope-select"
        >
          <MenuItem value="__all__">Workspace (all documents)</MenuItem>
          {documents.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {docsLoading || loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
          <LadyJusticeProgressIndicator size={18} />
          <Typography variant="body2">Loading…</Typography>
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      {data.nodes.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary">
          No claims with evidence in scope.
        </Typography>
      ) : (
        <GraphRenderer
          data={data}
          claimHref={(id) => `/claims/${encodeURIComponent(id)}`}
          evidenceHref={evidenceHref}
          evidenceMeta={evidenceMeta.size > 0 ? evidenceMeta : undefined}
        />
      )}
    </ContentSurface>
  );
}
