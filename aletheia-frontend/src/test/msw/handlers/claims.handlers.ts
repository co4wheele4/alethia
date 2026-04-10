import { graphql, HttpResponse } from 'msw';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

type FixtureDocument = (typeof fixture.documents)[number];
type FixtureEvidence = {
  __typename: 'Evidence';
  id: string;
  createdAt: string;
  createdBy: string;
  sourceType: string;
  sourceDocumentId: string;
  chunkId?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  snippet?: string | null;
};
type FixtureClaim = {
  __typename: 'Claim';
  id: string;
  text: string;
  status: string;
  createdAt: string;
  evidence: readonly FixtureEvidence[];
};

function fail(message: string): never {
  throw new Error(`[MSW contract] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertEvidence(ev: FixtureEvidence, label: string) {
  assertPresent(ev.id, `${label}.id`);
  assertPresent(ev.sourceDocumentId, `${label}.sourceDocumentId`);
  assertPresent(ev.createdBy, `${label}.createdBy`);
}

function assertClaimGrounded(claim: FixtureClaim, label: string) {
  assertPresent(claim.id, `${label}.id`);
  assertPresent(claim.text, `${label}.text`);
  assertPresent(claim.status, `${label}.status`);
  if (!Array.isArray(claim.evidence)) fail(`${label}.evidence must be an array`);
  if (claim.evidence.length === 0) fail(`${label}.evidence must be non-empty`);
  claim.evidence.forEach((ev, idx) => assertEvidence(ev, `${label}.evidence[${idx}]`));
}

function toDocumentCoreFields(doc: FixtureDocument) {
  // Must match DocumentCoreFields fragment selection.
  assertPresent(doc.sourceType, 'Document.sourceType');
  assertPresent(doc.sourceLabel, 'Document.sourceLabel');
  assertPresent(doc.source, 'Document.source');

  const src = doc.source;
  return {
    __typename: doc.__typename,
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    sourceType: doc.sourceType,
    sourceLabel: doc.sourceLabel,
    source: {
      __typename: src.__typename,
      id: src.id,
      documentId: src.documentId,
      kind: src.kind,
      ingestedAt: src.ingestedAt,
      accessedAt: src.accessedAt,
      publishedAt: src.publishedAt,
      author: src.author,
      publisher: src.publisher,
      filename: src.filename,
      mimeType: src.mimeType,
      contentType: src.contentType,
      sizeBytes: src.sizeBytes,
      requestedUrl: src.requestedUrl,
      fetchedUrl: src.fetchedUrl,
      contentSha256: src.contentSha256,
      fileSha256: src.fileSha256,
      lastModifiedMs: src.lastModifiedMs,
    },
  };
}

function isFixtureDocument(doc: FixtureDocument | undefined): doc is FixtureDocument {
  return Boolean(doc);
}

function toClaim(claim: FixtureClaim) {
  assertClaimGrounded(claim, `Claim(${claim.id})`);

  const docIds = Array.from(new Set(claim.evidence.map((e) => e.sourceDocumentId).filter(Boolean)));
  const documents = docIds
    .map((id) => fixture.documents.find((d) => d.id === id))
    .filter(isFixtureDocument)
    .map(toDocumentCoreFields);

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

const ADR033_ORDER = new Set([
  'CREATED_AT_ASC',
  'CREATED_AT_DESC',
  'ID_ASC',
  'ID_DESC',
]);

export const claimHandlers = [
  graphql.query('SearchClaims', ({ variables }) => {
    const input = (variables as { input?: { orderBy?: string; queryText?: string } } | undefined)
      ?.input;
    if (!input?.orderBy || !ADR033_ORDER.has(input.orderBy)) {
      fail(`SearchClaims: orderBy must be one of ${[...ADR033_ORDER].join(', ')}`);
    }
    const q = input.queryText ?? '';
    const filtered =
      q === ''
        ? fixture.claims
        : fixture.claims.filter((c) =>
            c.text.toLowerCase().includes(q.toLowerCase()),
          );
    const data = { searchClaims: filtered.map(toClaim) };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('ListClaims', ({ variables }) => {
    const limit = (variables as { limit?: number } | undefined)?.limit ?? 500;
    const offset = (variables as { offset?: number } | undefined)?.offset ?? 0;
    const mapped = fixture.claims.map(toClaim);
    const data = { claims: mapped.slice(offset, offset + limit) };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('ClaimsByDocument', ({ variables }) => {
    const documentId = assertPresent(
      (variables as { documentId?: string } | undefined)?.documentId,
      'ClaimsByDocument.variables.documentId'
    );
    const claims = fixture.claims.filter((c) =>
      c.evidence.some((e) => e.sourceDocumentId === documentId)
    );
    const data = { claimsByDocument: claims.map(toClaim) };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

