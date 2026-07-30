'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';

import { WorkspaceEmptyHelp } from '../../../components/common/WorkspaceEmptyHelp';
import { ContentSurface } from '../../../components/layout';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useClaims } from '../hooks/useClaims';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { ClaimDetailDrawer } from './ClaimDetailDrawer';
import { ClaimsList } from './ClaimsList';

export function ClaimsView(props: { userId: string | null; userRole?: string | null }) {
  const { userId, userRole } = props;
  const router = useRouter();
  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);

  const [scopeDocumentId, setScopeDocumentId] = useState<string>('__all__');
  const activeDocumentId = useMemo(() => (scopeDocumentId === '__all__' ? null : scopeDocumentId), [scopeDocumentId]);

  const { claims, loading: claimsLoading, error: claimsError } = useClaims(activeDocumentId);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const selectedClaim = useMemo(() => claims.find((c) => c.id === selectedClaimId) ?? null, [claims, selectedClaimId]);

  /** Selection order: first id is base; remaining ids are explicit partners (ADR-010). */
  const [comparisonClaimIds, setComparisonClaimIds] = useState<string[]>([]);
  const canCompare = comparisonClaimIds.length >= 2;

  if (!userId) {
    return <Alert severity="info">Claims inspection is available after login.</Alert>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2, alignItems: 'start' }}>
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Claims
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Read-only claim statements with linked evidence when available. No ranking or confidence is shown (ADR-038).
          Claims without evidence must never render. Inspect passages per document under{' '}
          <Link href="/evidence">Evidence</Link>.
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
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Box>
        ) : null}

        {claimsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {claimsError.message}
          </Alert>
        ) : null}

        {!docsLoading && !claimsLoading && !claimsError && !docsError && claims.length === 0 ? (
          <WorkspaceEmptyHelp surface="claims" userRole={userRole} />
        ) : null}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Comparison (user-initiated)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Select two or more claims (first selected is the base; others are partners). Opens a neutral side-by-side
            view of only those claims. Partners are never inferred from shared documents or evidence (ADR-010, ADR-021).
            No conflict, agreement, or confidence is inferred.
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Button
              size="small"
              variant="contained"
              disabled={!canCompare}
              onClick={() => {
                if (!canCompare) return;
                const [baseId, ...partnerIds] = comparisonClaimIds;
                const base = encodeURIComponent(baseId);
                const withParams = partnerIds.map((id) => `with=${encodeURIComponent(id)}`).join('&');
                router.push(`/claims/compare?base=${base}&${withParams}`);
              }}
              aria-label="Open claim comparison"
              sx={{ textTransform: 'none' }}
            >
              Compare selected ({comparisonClaimIds.length}/2+)
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={comparisonClaimIds.length === 0}
              onClick={() => setComparisonClaimIds([])}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          </Stack>
        </Box>

        <ClaimsList
          claims={claims}
          selectedClaimId={selectedClaimId}
          onSelectClaim={setSelectedClaimId}
          comparisonClaimIds={comparisonClaimIds}
          onToggleComparisonClaim={(claimId) => {
            setComparisonClaimIds((prev) =>
              prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
            );
          }}
        />
      </ContentSurface>

      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Claim inspection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a claim to open the inspection drawer. Evidence is reachable via the existing Evidence Viewer.
        </Typography>
      </ContentSurface>

      <ClaimDetailDrawer open={Boolean(selectedClaimId)} claim={selectedClaim} onClose={() => setSelectedClaimId(null)} />
    </Box>
  );
}
