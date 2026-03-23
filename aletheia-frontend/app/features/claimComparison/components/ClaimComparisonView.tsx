'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { useClaimsForComparison } from '../hooks/useClaimsForComparison';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { ClaimComparisonColumn } from './ClaimComparisonColumn';
import { ClaimComparisonPanel } from './ClaimComparisonPanel';
import { RequestReviewDialog } from './RequestReviewDialog';
import { useRequestReview } from '../../reviewerQueue';
import { ReviewActivityPanel } from '../../reviewActivity/components/ReviewActivityPanel';
import { useReviewActivityForClaim } from '../../reviewActivity/hooks/useReviewActivityForClaim';
import type { ClaimEvidenceListModel } from './ClaimEvidenceList';
import type { ClaimComparisonClaim, ClaimComparisonDocument } from '../hooks/useClaimsForComparison';
import type { ClaimEvidenceSnippetModel } from './ClaimEvidenceSnippet';

function fail(message: string): never {
  throw new Error(`[ClaimComparison] ${message}`);
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function relatedClaimsFromSchema(args: { base: ClaimComparisonClaim; all: ClaimComparisonClaim[] }) {
  const { base, all } = args;
  const baseDocIds = new Set((base.documents ?? []).map((d) => d.id));

  return all.filter(
    (c) =>
      c.id !== base.id && (c.documents ?? []).some((d) => baseDocIds.has(d.id))
  );
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertValidOffsets(args: { text: string; start: number; end: number; label: string }) {
  const { text, start, end, label } = args;
  if (!Number.isFinite(start) || !Number.isFinite(end)) fail(`${label} has non-numeric offsets`);
  if (start < 0 || end <= start) fail(`${label} has invalid offsets [${start}, ${end})`);
  if (end > text.length) fail(`${label} offsets exceed chunk length (${end} > ${text.length})`);
}

function buildEvidenceModel(claim: ClaimComparisonClaim): ClaimEvidenceListModel {
  const snippets: ClaimEvidenceSnippetModel[] = [];

  const docById = new Map((claim.documents ?? []).map((d) => [d.id, d]));

  for (const ev of claim.evidence ?? []) {
    const docId = ev.sourceDocumentId;
    const chunkId = ev.chunkId;
    const startOffset = ev.startOffset;
    const endOffset = ev.endOffset;
    if (!docId || !chunkId || startOffset == null || endOffset == null) continue;

    const doc = docById.get(docId);
    if (!doc) continue;

    const chunk = doc.chunks?.find((c) => c.id === chunkId);
    if (!chunk) continue;

    const chunkText = chunk.content ?? '';
    assertValidOffsets({ text: chunkText, start: startOffset, end: endOffset, label: `Evidence(${ev.id})` });

    const matchingMention = (chunk.mentions ?? []).find(
      (m) => m.startOffset != null && m.endOffset != null && m.startOffset === startOffset && m.endOffset === endOffset
    );
    const mentionId = matchingMention?.id ?? '';

    snippets.push({
      kind: 'mention',
      evidenceId: ev.id,
      documentId: doc.id,
      documentTitle: doc.title,
      chunkIndex: chunk.chunkIndex,
      chunkText,
      startOffset,
      endOffset,
      mentionId,
      entityLabel: ev.snippet ?? matchingMention?.excerpt ?? null,
    });
  }

  return {
    snippets,
    relationshipsWithNoEvidence: [],
    relationshipsPending: [],
  };
}

export function ClaimComparisonView(props: { baseClaimId: string; withClaimIds?: string[] }) {
  const { baseClaimId, withClaimIds = [] } = props;
  const { claims, loading, error } = useClaimsForComparison();
  const router = useRouter();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewActivityOpen, setReviewActivityOpen] = useState(false);
  const requestReview = useRequestReview();

  const base = useMemo(() => claims.find((c) => c.id === baseClaimId) ?? null, [claims, baseClaimId]);
  const reviewActivity = useReviewActivityForClaim(base?.id ?? null);

  const explicitRelated = useMemo(() => {
    if (!withClaimIds.length) return [];
    const byId = new Map(claims.map((c) => [c.id, c] as const));
    const out: ClaimComparisonClaim[] = [];
    for (const id of withClaimIds) {
      const c = byId.get(id);
      if (c) out.push(c);
    }
    return out;
  }, [claims, withClaimIds]);

  const missingWithClaimIds = useMemo(() => {
    if (!withClaimIds.length) return [];
    const known = new Set(claims.map((c) => c.id));
    return withClaimIds.filter((id) => !known.has(id));
  }, [claims, withClaimIds]);

  const derivedRelated = useMemo(() => {
    if (!base) return [];
    return relatedClaimsFromSchema({
      base,
      all: claims,
    }).sort((a, b) => a.id.localeCompare(b.id));
  }, [base, claims]);

  const related = useMemo(() => {
    // ADR-010: comparison is user-initiated. If explicit `with=` is provided, prefer it (no implicit additions).
    if (withClaimIds.length) return explicitRelated;
    return derivedRelated;
  }, [derivedRelated, explicitRelated, withClaimIds.length]);

  const comparedClaims = useMemo(() => (base ? [base, ...related] : []), [base, related]);

  const { evidenceByClaimId, contractError } = useMemo(() => {
    if (!base) return { evidenceByClaimId: new Map<string, ClaimEvidenceListModel>(), contractError: null as Error | null };

    try {
      const m = new Map<string, ClaimEvidenceListModel>();
      for (const c of comparedClaims) {
        if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
          fail(`Claim(${c.id}) violates contract: evidence[] must be non-empty`);
        }
        if (!Array.isArray(c.documents) || c.documents.length === 0) {
          fail(`Claim(${c.id}) violates contract: documents[] must be non-empty (for document titles and offset inspection)`);
        }
        m.set(c.id, buildEvidenceModel(c));
      }
      return { evidenceByClaimId: m, contractError: null };
    } catch (err) {
      return { evidenceByClaimId: new Map<string, ClaimEvidenceListModel>(), contractError: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [base, comparedClaims]);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (loading && claims.length === 0) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
        <LadyJusticeProgressIndicator size={18} />
        <Typography variant="body2">Loading comparison data…</Typography>
      </Stack>
    );
  }

  if (!base) {
    return (
      <Alert severity="warning">
        The base claim is not available in the schema-backed dataset. Comparison requires evidence-closed claims (ADR-018). Return to{' '}
        <Link href="/claims">Claims</Link> and open comparison again.
      </Alert>
    );
  }

  if (contractError) {
    return (
      <Alert severity="error">
        Comparison is blocked by a schema/contract requirement. {contractError.message}
      </Alert>
    );
  }

  return (
    <Box>
      <ClaimComparisonPanel
        onRequestReview={() => setReviewDialogOpen(true)}
        requestReviewDisabled={!base}
        reviewActivityCount={reviewActivity.items.length}
        onOpenReviewActivity={() => setReviewActivityOpen(true)}
        modeCaption={
          withClaimIds.length
            ? 'Compared claims were explicitly selected via URL query params (with=...). No additional claims are inferred or added.'
            : 'Related claims are derived client-side from shared document IDs.'
        }
      />

      <RequestReviewDialog
        open={reviewDialogOpen}
        claimId={base.id}
        onClose={() => setReviewDialogOpen(false)}
        submitting={requestReview.loading}
        error={requestReview.error}
        onConfirm={async (args) => {
          // ADR-009/010: comparison remains read-only.
          // Review request is coordination-only and must not change claim status/truth (ADR-005/008/012).
          try {
            await requestReview.requestReview({
              claimId: base.id,
              source: 'COMPARISON',
              note: args.note ?? null,
            });
            setReviewDialogOpen(false);
            router.push('/review-queue');
          } catch {
            // Error is rendered inside the dialog.
          }
        }}
      />

      <Dialog
        open={reviewActivityOpen}
        onClose={() => setReviewActivityOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-label="Review activity details"
      >
        <DialogTitle>Review activity (coordination only)</DialogTitle>
        <DialogContent dividers>
          {base ? <ReviewActivityPanel claimId={base.id} defaultExpanded /> : <Alert severity="warning">Missing base claim.</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewActivityOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {!loading && withClaimIds.length && missingWithClaimIds.length ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some requested claims were not available in the current schema-backed dataset: {missingWithClaimIds.join(', ')}.
        </Alert>
      ) : null}

      {!withClaimIds.length && related.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No related claims were found based on shared documents/entities exposed by the current GraphQL schema.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: { xs: '100%', sm: 'minmax(360px, 1fr)', lg: 'minmax(420px, 1fr)' },
          gap: 2,
          alignItems: 'start',
          overflowX: 'auto',
          pb: 1,
        }}
      >
        {comparedClaims.map((c, idx) => (
          <ClaimComparisonColumn
            key={c.id}
            label={idx === 0 ? 'Base' : `Claim ${idx + 1}`}
            claim={c}
            baseClaimText={base.text}
            evidence={evidenceByClaimId.get(c.id) ?? { snippets: [], relationshipsWithNoEvidence: [], relationshipsPending: [] }}
          />
        ))}
      </Box>
    </Box>
  );
}

