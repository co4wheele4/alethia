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

function assertNonEmptyArray<T>(value: T[] | null | undefined, label: string): T[] {
  const v = assertPresent(value, label);
  if (!Array.isArray(v) || v.length === 0) fail(`${label} must be a non-empty array`);
  return v;
}

function assertOffsets(start: number | null | undefined, end: number | null | undefined, label: string) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    fail(`${label} requires numeric startOffset/endOffset (got ${String(start)}/${String(end)})`);
  }
  const s = start;
  const e = end;
  if (s < 0 || e <= s) fail(`${label} has invalid offsets (start=${s}, end=${e})`);
}

function listRelationships() {
  // Fill required nested links without duplicating the full fixture graph in the fixture file.
  const mentionById = new Map(
    fixture.documents.flatMap((d) => d.chunks.flatMap((c) => c.mentions.map((m) => [m.id, m] as const)))
  );
  const documentById = new Map(fixture.documents.map((d) => [d.id, d] as const));

  return fixture.relationships.map((r) => {
    assertNonEmptyArray(r.evidence as unknown as unknown[], `EntityRelationship(${r.id}).evidence`);
    const evidence = r.evidence.map((ev) => {
      assertOffsets(ev.startOffset, ev.endOffset, `EntityRelationshipEvidence(${ev.id})`);
      const chunkDocument = assertPresent(documentById.get(ev.chunk.documentId), 'Evidence.chunk.document');
      const mentionLinks = ev.mentionLinks.map((ml) => {
        const mention = assertPresent(mentionById.get(ml.mentionId), `EvidenceMention(${ml.mentionId}).mention`);
        assertOffsets(mention.startOffset, mention.endOffset, `EntityMention(${mention.id})`);
        return {
          __typename: ml.__typename,
          evidenceId: ml.evidenceId,
          mentionId: ml.mentionId,
          mention,
        };
      });

      return {
        __typename: ev.__typename,
        id: ev.id,
        kind: ev.kind,
        createdAt: ev.createdAt,
        chunkId: ev.chunkId,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quotedText: ev.quotedText,
        chunk: {
          __typename: ev.chunk.__typename,
          id: ev.chunk.id,
          chunkIndex: ev.chunk.chunkIndex,
          content: ev.chunk.content,
          documentId: ev.chunk.documentId,
          document: chunkDocument,
        },
        mentionLinks,
      };
    });

    return {
      __typename: r.__typename,
      id: r.id,
      relation: r.relation,
      from: r.from,
      to: r.to,
      evidence,
    };
  });
}

export const relationshipHandlers = [
  graphql.query('ListRelationships', () => {
    const data = { entityRelationships: listRelationships() };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

