import { fixture } from '@/src/mocks/aletheia-fixtures';

function fail(message: string): never {
  throw new Error(`[MSW contract] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertArray<T>(value: readonly T[] | null | undefined, label: string): readonly T[] {
  const v = assertPresent(value, label);
  if (!Array.isArray(v)) fail(`${label} must be an array`);
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

export function buildRelationships() {
  // Fill required nested links without duplicating the full fixture graph in the fixture file.
  const mentionById = new Map(
    fixture.documents.flatMap((d) => d.chunks.flatMap((c) => c.mentions.map((m) => [m.id, m] as const)))
  );
  const documentById = new Map(fixture.documents.map((d) => [d.id, d] as const));

  return fixture.relationships.map((r) => {
    const evidenceArr = assertArray(r.evidence, `EntityRelationship(${r.id}).evidence`);

    const evidence = evidenceArr.map((ev) => {
      assertOffsets(ev.startOffset, ev.endOffset, `EntityRelationshipEvidence(${ev.id})`);
      const chunkDocument = assertPresent(documentById.get(ev.chunk.documentId), 'Evidence.chunk.document');

      const mentionLinks = assertArray(ev.mentionLinks, `EntityRelationshipEvidence(${ev.id}).mentionLinks`).map((ml) => {
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

