import { graphql, HttpResponse } from 'msw';
import { Kind, type DocumentNode } from 'graphql';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { DOCUMENT_CORE_FRAGMENT } from '@/src/graphql';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';
import { buildRelationships } from '@/src/test/msw/buildRelationships';

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

function assertDocumentHasEvidence(doc: NonNullable<ReturnType<typeof asDocumentById>>) {
  assertPresent(doc.chunks, 'Document.chunks');
  // Widen the fixture's readonly tuple union into a stable array shape for checks.
  const chunks: ReadonlyArray<{ mentions?: ReadonlyArray<unknown> | undefined }> = doc.chunks as unknown as ReadonlyArray<{
    mentions?: ReadonlyArray<unknown> | undefined;
  }>;
  if (chunks.length === 0) fail('Document has no chunks (Truth Surface requires chunk text)');
  const mentionCount = chunks.reduce((acc, c) => acc + (c.mentions?.length ?? 0), 0);
  if (mentionCount === 0) fail('Document has no mentions (Truth Surface requires explicit mention evidence)');
}

function toDocumentEvidenceView(doc: NonNullable<ReturnType<typeof asDocumentById>>) {
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

function documentIndexByUser() {
  // Return exactly the fields selected by `DocumentIndexByUser` (DocumentFields + chunk ids/indexes + mention ids + EntityBasicFields).
  return fixture.documents.map((d) => {
    const full = asDocumentById(d.id);
    if (!full) return null;
    assertDocumentHasEvidence(full);

    return {
      __typename: full.__typename,
      id: full.id,
      title: full.title,
      createdAt: full.createdAt,
      sourceType: full.sourceType,
      sourceLabel: full.sourceLabel,
      chunks: full.chunks.map((c) => ({
        __typename: c.__typename,
        id: c.id,
        chunkIndex: c.chunkIndex,
        mentions: c.mentions.map((m) => ({
          __typename: m.__typename,
          id: m.id,
          entity: {
            __typename: m.entity.__typename,
            id: m.entity.id,
            name: m.entity.name,
            type: m.entity.type,
            mentionCount: m.entity.mentionCount,
          },
        })),
      })),
    };
  }).filter(Boolean);
}

export const documentHandlers = [
  graphql.query('DocumentsByUser', ({ variables }) => {
    const userId = assertPresent((variables as { userId?: string } | undefined)?.userId, 'DocumentsByUser.variables.userId');
    // This mock does not currently partition by user; it returns the deterministic fixture set.
    // The important contract is: provenance and mention offsets must still be valid in the backing fixture.
    void userId;

    const data = {
      documentsByUser: fixture.documents.map((d) => {
        const full = asDocumentById(d.id);
        if (!full) return null;
        assertDocumentHasEvidence(full);
        return {
          __typename: full.__typename,
          id: full.id,
          title: full.title,
          createdAt: full.createdAt,
          sourceType: full.sourceType,
          sourceLabel: full.sourceLabel,
        };
      }).filter(Boolean),
    };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('DocumentIndexByUser', ({ variables }) => {
    const userId = assertPresent(
      (variables as { userId?: string } | undefined)?.userId,
      'DocumentIndexByUser.variables.userId'
    );
    // This mock does not currently partition by user; it returns the deterministic fixture set.
    void userId;

    const data = { documentsByUser: documentIndexByUser() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('ChunksByDocument', ({ variables }) => {
    const documentId = assertPresent(
      (variables as { documentId?: string } | undefined)?.documentId,
      'ChunksByDocument.variables.documentId'
    );
    const doc = asDocumentById(documentId);
    const chunks = doc?.chunks ?? [];

    // Enforce mention offsets (audit-grade anchoring into chunk content).
    for (const c of chunks) {
      for (const m of c.mentions) {
        assertOffsets(m.startOffset, m.endOffset, `EntityMention(${m.id})`);
        assertPresent(m.entity, `EntityMention(${m.id}).entity`);
      }
    }

    const data = {
      chunksByDocument: chunks.map((c) => ({
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
          entity: {
            __typename: m.entity.__typename,
            id: m.entity.id,
            name: m.entity.name,
            type: m.entity.type,
            mentionCount: m.entity.mentionCount,
          },
        })),
      })),
    };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  // App uses `query Document($id: String!) { document(id: $id) { ...DocumentFields } }`
  graphql.query('Document', ({ variables }) => {
    const id = assertPresent((variables as { id?: string } | undefined)?.id, 'Document.variables.id');
    const doc = asDocumentById(id);
    const data = {
      document: doc
        ? {
            __typename: doc.__typename,
            id: doc.id,
            title: doc.title,
            createdAt: doc.createdAt,
            sourceType: doc.sourceType,
            sourceLabel: doc.sourceLabel,
          }
        : null,
    };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

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

  graphql.query('GetDocumentEvidenceView', ({ variables }) => {
    const id = assertPresent(
      (variables as { id?: string } | undefined)?.id,
      'GetDocumentEvidenceView.variables.id'
    );
    const doc = asDocumentById(id);
    if (doc) assertDocumentHasEvidence(doc);
    const data = { document: doc ? toDocumentEvidenceView(doc) : null };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('GetDocumentIntelligence', ({ variables }) => {
    const id = assertPresent(
      (variables as { id?: string } | undefined)?.id,
      'GetDocumentIntelligence.variables.id'
    );
    const doc = asDocumentById(id);
    const data = { document: doc, entityRelationships: buildRelationships() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

