import { graphql, HttpResponse } from 'msw';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

function fail(message: string): never {
  // Fail fast in tests and dev: surface contract breaks immediately.
  throw new Error(`[MSW contract] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertOffsets(start: number | null | undefined, end: number | null | undefined, label: string) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    fail(`${label} requires numeric startOffset/endOffset (got ${String(start)}/${String(end)})`);
  }
  const s = start;
  const e = end;
  if (s < 0 || e <= s) fail(`${label} has invalid offsets (start=${s}, end=${e})`);
}

function asDocumentById(id: string) {
  const doc = fixture.documents.find((d) => d.id === id);
  if (!doc) return null;

  // Enforce provenance visibility (allowed by schema, required by trust UI).
  assertPresent(doc.sourceType, 'Document.sourceType');
  assertPresent(doc.sourceLabel, 'Document.sourceLabel');
  assertPresent(doc.source, 'Document.source');

  // Enforce mention offsets (audit-grade anchoring into chunk content).
  for (const chunk of doc.chunks) {
    for (const m of chunk.mentions) {
      assertOffsets(m.startOffset, m.endOffset, `EntityMention(${m.id})`);
      assertPresent(m.entity, `EntityMention(${m.id}).entity`);
    }
  }

  return doc;
}

function listDocuments() {
  // Return exactly the fields selected by `ListDocuments` (DocumentFragment + chunk id stubs).
  return fixture.documents.map((d) => ({
    __typename: d.__typename,
    id: d.id,
    title: d.title,
    createdAt: d.createdAt,
    sourceType: d.sourceType,
    sourceLabel: d.sourceLabel,
    source: d.source,
    chunks: d.chunks.map((c) => ({ __typename: c.__typename, id: c.id })),
  }));
}

export const documentHandlers = [
  graphql.query('ListDocuments', () => {
    const data = { documents: listDocuments() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('GetDocumentById', ({ variables }) => {
    const id = assertPresent((variables as { id?: string } | undefined)?.id, 'GetDocumentById.variables.id');
    const doc = asDocumentById(id);
    const data = { document: doc };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

