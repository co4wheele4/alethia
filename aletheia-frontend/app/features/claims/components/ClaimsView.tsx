'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

import { useDocuments } from '../../documents/hooks/useDocuments';
import { useClaims } from '../hooks/useClaims';
import { ClaimDetailDrawer } from './ClaimDetailDrawer';
import { ClaimsList } from './ClaimsList';

export function ClaimsView(props: { userId: string | null }) {
  const { userId } = props;
  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);

  const [scopeDocumentId, setScopeDocumentId] = useState<string>('__all__');
  const activeDocumentId = useMemo(() => (scopeDocumentId === '__all__' ? null : scopeDocumentId), [scopeDocumentId]);

  const { claims, loading: claimsLoading, error: claimsError } = useClaims(activeDocumentId);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const selectedClaim = useMemo(() => claims.find((c) => c.id === selectedClaimId) ?? null, [claims, selectedClaimId]);

  if (!userId) {
    return <Alert severity="info">Claims inspection is available after login.</Alert>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2, alignItems: 'start' }}>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Claims
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Read-only assertions grounded in explicit evidence. Claims without evidence must never render.
        </Typography>

        {docsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {docsError.message}
          </Alert>
        ) : null}

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="claims-scope-label">Scope</InputLabel>
          <Select
            labelId="claims-scope-label"
            label="Scope"
            value={scopeDocumentId}
            onChange={(e) => {
              setSelectedClaimId(null);
              setScopeDocumentId(String(e.target.value));
            }}
            aria-label="claims-scope-select"
          >
            <MenuItem value="__all__">Workspace (all documents)</MenuItem>
            {documents.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {docsLoading || claimsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Box>
        ) : null}

        {claimsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {claimsError.message}
          </Alert>
        ) : null}

        <ClaimsList claims={claims} selectedClaimId={selectedClaimId} onSelectClaim={setSelectedClaimId} />
      </Box>

      <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Claim inspection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a claim to open the inspection drawer. Evidence is reachable via the existing Evidence Viewer.
        </Typography>
      </Box>

      <ClaimDetailDrawer open={Boolean(selectedClaimId)} claim={selectedClaim} onClose={() => setSelectedClaimId(null)} />
    </Box>
  );
}

