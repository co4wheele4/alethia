import { graphql, HttpResponse } from 'msw';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

type FixtureDocument = (typeof fixture.documents)[number];
type FixtureClaimEvidence = (typeof fixture.claims)[number]['evidence'][number];
type FixtureClaim = (typeof fixture.claims)[number];

function fail(message: string): never {
  throw new Error(`[MSW contract] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertNoConflictMetadata(value: unknown, path = 'root', seen = new Set<object>()) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) assertNoConflictMetadata(value[i], `${path}[${i}]`, seen);
    return;
  }
  if (typeof value !== 'object') return;
  if (seen.has(value as object)) return;
  seen.add(value as object);

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (key.includes('conflict') || key.includes('contradict') || key.includes('agreement')) {
      fail(`Unexpected conflict metadata field "${k}" at ${path}.${k}`);
    }
    assertNoConflictMetadata(v, `${path}.${k}`, seen);
  }
}

function assertEvidence(ev: FixtureClaimEvidence, label: string) {
  assertPresent(ev.id, `${label}.id`);
  assertPresent(ev.sourceDocumentId, `${label}.sourceDocumentId`);
  assertPresent(ev.createdBy, `${label}.createdBy`);
}

function assertClaimGrounded(claim: FixtureClaim, label: string) {
  assertPresent(claim.id, `${label}.id`);
  assertPresent(claim.text, `${label}.text`);
  assertPresent(claim.status, `${label}.status`);
  if (!Array.isArray(claim.evidence)) fail(`${label}.evidence must be an array`);
  const evidence = [...claim.evidence];
  if (evidence.length === 0) fail(`${label}.evidence must be non-empty`);
  evidence.forEach((ev, idx) => assertEvidence(ev, `${label}.evidence[${idx}]`));
}

function toDocumentEvidenceView(doc: FixtureDocument) {
  assertPresent(doc.sourceType, 'Document.sourceType');
  assertPresent(doc.sourceLabel, 'Document.sourceLabel');
  assertPresent(doc.source, 'Document.source');

  return {
    __typename: doc.__typename,
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    sourceType: doc.sourceType,
    sourceLabel: doc.sourceLabel,
    source: doc.source,
    chunks: doc.chunks.map((c) => ({
      __typename: c.__typename,
      id: c.id,
      chunkIndex: c.chunkIndex,
      content: c.content,
      documentId: c.documentId,
      mentions: c.mentions.map((m) => ({
        __typename: m.__typename,
        id: m.id,
        entityId: m.entityId,
        chunkId: m.chunkId,
        startOffset: m.startOffset,
        endOffset: m.endOffset,
        excerpt: m.excerpt,
        entity: m.entity,
      })),
    })),
  };
}

function isFixtureDocument(doc: FixtureDocument | undefined): doc is FixtureDocument {
  return Boolean(doc);
}

function toClaimForComparison(claim: FixtureClaim) {
  assertClaimGrounded(claim, `Claim(${claim.id})`);

  const docIds = Array.from(new Set([...claim.evidence].map((e) => e.sourceDocumentId).filter(Boolean)));
  const documents = docIds
    .map((id) => fixture.documents.find((d) => d.id === id))
    .filter(isFixtureDocument)
    .map(toDocumentEvidenceView);

  if (documents.length === 0) {
    fail(`Claim(${claim.id}) has no derivable documents from evidence`);
  }

  return {
    __typename: claim.__typename,
    id: claim.id,
    text: claim.text,
    status: claim.status,
    createdAt: claim.createdAt,
    evidence: claim.evidence.map((ev) => ({
      __typename: ev.__typename,
      id: ev.id,
      createdAt: ev.createdAt,
      createdBy: ev.createdBy,
      sourceType: ev.sourceType,
      sourceDocumentId: ev.sourceDocumentId,
      chunkId: ev.chunkId ?? null,
      startOffset: ev.startOffset ?? null,
      endOffset: ev.endOffset ?? null,
      snippet: ev.snippet ?? null,
    })),
    documents,
  };
}

export const claimComparisonHandlers = [
  graphql.query('GetClaimsForComparison', () => {
    const data = { claims: fixture.claims.map(toClaimForComparison) };
    assertNoConfidence(data, 'data');
    assertNoConflictMetadata(data, 'data');
    return HttpResponse.json({ data });
  }),
];

