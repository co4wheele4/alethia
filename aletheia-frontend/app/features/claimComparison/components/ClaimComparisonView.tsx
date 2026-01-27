'use client';

import Link from 'next/link';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { useClaimsForComparison } from '../hooks/useClaimsForComparison';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { LIST_RELATIONSHIPS_QUERY } from '@/src/graphql';
import { ClaimComparisonColumn } from './ClaimComparisonColumn';
import type { ClaimEvidenceListModel } from './ClaimEvidenceList';
import type { ClaimComparisonClaim, ClaimComparisonDocument, ClaimComparisonMention } from '../hooks/useClaimsForComparison';
import type { ClaimEvidenceSnippetModel } from './ClaimEvidenceSnippet';

type RelationshipEvidenceAnchor = {
  __typename?: 'EntityRelationshipEvidence';
  id: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  chunk: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    document: { __typename?: 'Document'; id: string; title: string; createdAt: string; sourceType?: string | null; sourceLabel?: string | null };
  };
};

type Relationship = {
  __typename?: 'EntityRelationship';
  id: string;
  evidence: RelationshipEvidenceAnchor[];
};

type ListRelationshipsData = { entityRelationships: Relationship[] };

function fail(message: string): never {
  throw new Error(`[ClaimComparison] ${message}`);
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

type MentionRef = {
  mention: ClaimComparisonMention;
  document: ClaimComparisonDocument;
  chunkIndex: number;
  chunkText: string;
};

function indexMentionsById(documents: ClaimComparisonDocument[]) {
  const byId = new Map<string, MentionRef>();
  for (const doc of documents ?? []) {
    for (const chunk of doc.chunks ?? []) {
      for (const mention of chunk.mentions ?? []) {
        byId.set(mention.id, {
          mention,
          document: doc,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.content ?? '',
        });
      }
    }
  }
  return byId;
}

function indexMentionEntityIdsByMentionId(documents: ClaimComparisonDocument[]) {
  const byId = new Map<string, string>();
  for (const doc of documents ?? []) {
    for (const chunk of doc.chunks ?? []) {
      for (const mention of chunk.mentions ?? []) {
        byId.set(mention.id, mention.entityId);
      }
    }
  }
  return byId;
}

function relatedClaimsFromSchema(args: { base: ClaimComparisonClaim; all: ClaimComparisonClaim[] }) {
  const { base, all } = args;
  const baseDocIds = new Set((base.documents ?? []).map((d) => d.id));

  const baseMentionEntityIds = (() => {
    const mentionIdToEntityId = indexMentionEntityIdsByMentionId(base.documents ?? []);
    const entityIds = new Set<string>();
    for (const ev of base.evidence ?? []) {
      for (const mentionId of ev.mentionIds ?? []) {
        const entityId = mentionIdToEntityId.get(mentionId);
        if (!entityId) {
          // Evidence references must be resolvable for offset-grounded inspection.
          fail(`Base claim references mentionId=${mentionId} but it is missing from its documents/chunks/mentions payload.`);
        }
        entityIds.add(entityId);
      }
    }
    return entityIds;
  })();

  const out = all
    .filter((c) => c.id !== base.id)
    .filter((c) => {
      const sharesDoc = (c.documents ?? []).some((d) => baseDocIds.has(d.id));
      if (sharesDoc) return true;

      if (baseMentionEntityIds.size === 0) return false;
      const mentionIdToEntityId = indexMentionEntityIdsByMentionId(c.documents ?? []);
      for (const ev of c.evidence ?? []) {
        for (const mentionId of ev.mentionIds ?? []) {
          const entityId = mentionIdToEntityId.get(mentionId);
          if (entityId && baseMentionEntityIds.has(entityId)) return true;
        }
      }
      return false;
    });

  return out;
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

function buildEvidenceModel(args: {
  claim: ClaimComparisonClaim;
  relationshipsById: Map<string, Relationship>;
  relationshipsPending: boolean;
}): ClaimEvidenceListModel {
  const { claim, relationshipsById, relationshipsPending } = args;

  const mentionIndex = indexMentionsById(claim.documents ?? []);

  const snippets: ClaimEvidenceSnippetModel[] = [];

  const relationshipsReferenced = uniqueStrings((claim.evidence ?? []).flatMap((e) => e.relationshipIds ?? [])).sort();
  const relationshipsPendingIds = relationshipsPending ? relationshipsReferenced : [];
  const relationshipsWithNoEvidence: string[] = [];

  for (const ev of claim.evidence ?? []) {
    for (const mentionId of uniqueStrings(ev.mentionIds ?? [])) {
      const ref = mentionIndex.get(mentionId);
      if (!ref) {
        fail(
          `Claim(${claim.id}) references mentionId=${mentionId}, but it is missing from documents/chunks/mentions (cannot render offsets).`
        );
      }

      const startOffset = assertPresent(ref.mention.startOffset, `EntityMention(${ref.mention.id}).startOffset`);
      const endOffset = assertPresent(ref.mention.endOffset, `EntityMention(${ref.mention.id}).endOffset`);
      assertValidOffsets({ text: ref.chunkText ?? '', start: startOffset, end: endOffset, label: `EntityMention(${ref.mention.id})` });

      snippets.push({
        kind: 'mention',
        evidenceId: ev.id,
        documentId: ref.document.id,
        documentTitle: ref.document.title,
        chunkIndex: ref.chunkIndex,
        chunkText: ref.chunkText ?? '',
        startOffset,
        endOffset,
        mentionId: ref.mention.id,
        entityLabel: ref.mention.entity?.name ?? ref.mention.excerpt ?? null,
      });
    }

    // Relationship evidence anchors are fetched via LIST_RELATIONSHIPS_QUERY (no by-id query exists in schema).
    for (const relationshipId of uniqueStrings(ev.relationshipIds ?? [])) {
      if (relationshipsPending) continue;
      const rel = relationshipsById.get(relationshipId);
      if (!rel) fail(`Claim(${claim.id}) references relationshipId=${relationshipId}, but it is missing from entityRelationships.`);

      if (!Array.isArray(rel.evidence) || rel.evidence.length === 0) {
        relationshipsWithNoEvidence.push(relationshipId);
        continue;
      }

      for (const anchor of rel.evidence) {
        const startOffset = assertPresent(anchor.startOffset, `EntityRelationshipEvidence(${anchor.id}).startOffset`);
        const endOffset = assertPresent(anchor.endOffset, `EntityRelationshipEvidence(${anchor.id}).endOffset`);
        const chunkText = assertPresent(anchor.chunk?.content, `EntityRelationshipEvidence(${anchor.id}).chunk.content`);
        assertValidOffsets({ text: chunkText, start: startOffset, end: endOffset, label: `EntityRelationshipEvidence(${anchor.id})` });
        const doc = assertPresent(anchor.chunk?.document, `EntityRelationshipEvidence(${anchor.id}).chunk.document`);

        snippets.push({
          kind: 'relationship',
          evidenceId: ev.id,
          relationshipId,
          anchorId: anchor.id,
          documentId: doc.id,
          documentTitle: doc.title,
          chunkIndex: anchor.chunk.chunkIndex,
          chunkText,
          startOffset,
          endOffset,
        });
      }
    }
  }

  return {
    snippets,
    relationshipsWithNoEvidence: uniqueStrings(relationshipsWithNoEvidence).sort(),
    relationshipsPending: relationshipsPendingIds,
  };
}

export function ClaimComparisonView(props: { baseClaimId: string }) {
  const { baseClaimId } = props;
  const { claims, loading, error } = useClaimsForComparison();
  const base = useMemo(() => claims.find((c) => c.id === baseClaimId) ?? null, [claims, baseClaimId]);

  const related = useMemo(() => {
    if (!base) return [];
    return relatedClaimsFromSchema({
      base,
      all: claims,
    }).sort((a, b) => a.id.localeCompare(b.id));
  }, [base, claims]);

  const comparedClaims = useMemo(() => (base ? [base, ...related] : []), [base, related]);

  const neededRelationshipIds = useMemo(() => {
    const ids: string[] = [];
    for (const c of comparedClaims) {
      for (const ev of c.evidence ?? []) {
        ids.push(...(ev.relationshipIds ?? []));
      }
    }
    return uniqueStrings(ids).sort();
  }, [comparedClaims]);

  const relationshipsQuery = useQuery<ListRelationshipsData>(LIST_RELATIONSHIPS_QUERY, {
    fetchPolicy: 'cache-first',
    skip: neededRelationshipIds.length === 0,
  });

  const relationshipsById = useMemo(() => {
    const m = new Map<string, Relationship>();
    for (const r of relationshipsQuery.data?.entityRelationships ?? []) m.set(r.id, r);
    return m;
  }, [relationshipsQuery.data]);

  const { evidenceByClaimId, contractError } = useMemo(() => {
    if (!base) return { evidenceByClaimId: new Map<string, ClaimEvidenceListModel>(), contractError: null as Error | null };
    if (relationshipsQuery.error) {
      return { evidenceByClaimId: new Map<string, ClaimEvidenceListModel>(), contractError: relationshipsQuery.error };
    }

    const pending = neededRelationshipIds.length > 0 && relationshipsQuery.loading;
    try {
      const m = new Map<string, ClaimEvidenceListModel>();
      for (const c of comparedClaims) {
        if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
          fail(`Claim(${c.id}) violates contract: evidence[] must be non-empty`);
        }
        if (!Array.isArray(c.documents) || c.documents.length === 0) {
          fail(`Claim(${c.id}) violates contract: documents[] must be non-empty (for document titles and offset inspection)`);
        }
        m.set(
          c.id,
          buildEvidenceModel({
            claim: c,
            relationshipsById,
            relationshipsPending: pending,
          })
        );
      }
      return { evidenceByClaimId: m, contractError: null };
    } catch (err) {
      return { evidenceByClaimId: new Map<string, ClaimEvidenceListModel>(), contractError: err instanceof Error ? err : new Error(String(err)) };
    }
  }, [base, comparedClaims, neededRelationshipIds.length, relationshipsById, relationshipsQuery.error, relationshipsQuery.loading]);

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
        The base claim is not available. Return to <Link href="/claims">Claims</Link> and open comparison again.
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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'baseline' }} sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">Claim comparison</Typography>
          <Typography variant="body2" color="text.secondary">
            Neutral, read-only side-by-side inspection. No conflict, agreement, ranking, or confidence is inferred.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Related claims are derived client-side from schema fields only (shared document IDs and evidence-linked entity IDs).
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button component={Link} href="/claims" size="small" sx={{ textTransform: 'none' }}>
          Back to Claims
        </Button>
      </Stack>

      {related.length === 0 ? (
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

