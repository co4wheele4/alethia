import { graphql, HttpResponse } from 'msw';
import { Kind, type DocumentNode } from 'graphql';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { DOCUMENT_CORE_FRAGMENT } from '@/src/graphql';
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

function fragmentFieldNames(doc: DocumentNode, fragmentName: string): string[] {
  const def = doc.definitions.find(
    (d): d is Extract<typeof d, { kind: typeof Kind.FRAGMENT_DEFINITION }> =>
      d.kind === Kind.FRAGMENT_DEFINITION && d.name.value === fragmentName
  );
  if (!def) fail(`Missing fragment definition "${fragmentName}"`);

  const fields: string[] = [];
  for (const sel of def.selectionSet.selections) {
    if (sel.kind !== Kind.FIELD) fail(`Fragment "${fragmentName}" must contain only field selections`);
    if (sel.selectionSet) fail(`Fragment "${fragmentName}" must not contain nested selections`);
    fields.push(sel.name.value);
  }
  return fields;
}

const DOCUMENT_CORE_KEYS = new Set(fragmentFieldNames(DOCUMENT_CORE_FRAGMENT, 'DocumentCore'));

function assertExactObjectKeys(value: unknown, allowed: Set<string>, label: string) {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);

  for (const k of keys) {
    if (!allowed.has(k)) fail(`${label} contains undocumented field "${k}"`);
  }
  for (const k of allowed) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) fail(`${label} is missing required field "${k}"`);
  }
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

function documentsIndex() {
  // Return exactly the fields selected by `DocumentsIndex` (DocumentCore only).
  const docs = fixture.documents.map((d) => ({
    __typename: d.__typename,
    id: d.id,
    title: d.title,
    sourceType: d.sourceType,
    createdAt: d.createdAt,
  }));
  for (const d of docs) assertExactObjectKeys(d, DOCUMENT_CORE_KEYS, `DocumentsIndex.documents[${d.id}]`);
  return docs;
}

export const documentHandlers = [
  graphql.query('ListDocuments', () => {
    const data = { documents: listDocuments() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('DocumentsIndex', () => {
    const data = { documents: documentsIndex() };
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

