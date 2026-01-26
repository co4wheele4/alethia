import { graphql, HttpResponse } from 'msw';

import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';
import { buildRelationships } from '@/src/test/msw/buildRelationships';

function entityCoreById(id: string) {
  const fromEntities = fixture.entities.find((e) => e.id === id);
  if (fromEntities) return fromEntities;

  // Fallback for entities that only appear in relationship fixtures.
  const fromRel =
    fixture.relationships.flatMap((r) => [r.from, r.to]).find((e) => e.id === id) ?? null;
  return fromRel
    ? {
        __typename: fromRel.__typename,
        id: fromRel.id,
        name: fromRel.name,
        type: fromRel.type,
        mentionCount: fromRel.mentionCount,
      }
    : null;
}

function mentionsForEntity(entityId: string) {
  const docs = fixture.documents;
  const mentions = docs.flatMap((d) =>
    d.chunks.flatMap((c) =>
      c.mentions
        .filter((m) => m.entityId === entityId)
        .map((m) => ({
          __typename: m.__typename,
          id: m.id,
          entityId: m.entityId,
          chunkId: m.chunkId,
          startOffset: m.startOffset,
          endOffset: m.endOffset,
          excerpt: m.excerpt,
          chunk: {
            __typename: c.__typename,
            id: c.id,
            chunkIndex: c.chunkIndex,
            content: c.content,
            documentId: c.documentId,
            document: {
              __typename: d.__typename,
              id: d.id,
              title: d.title,
              createdAt: d.createdAt,
            },
          },
        }))
    )
  );
  return mentions;
}

export const entityHandlers = [
  // App uses `query Entities { entities { ...EntityBasicFields } }`
  graphql.query('Entities', () => {
    const data = { entities: fixture.entities };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  // App uses `query Entity($id: String!) { entity(id: $id) { ... } }`
  graphql.query('Entity', ({ variables }) => {
    const id = (variables as { id?: string } | undefined)?.id ?? null;
    const core = id ? entityCoreById(id) : null;
    const rels = buildRelationships();
    const outgoing = core ? rels.filter((r) => r.from?.id === core.id) : [];
    const incoming = core ? rels.filter((r) => r.to?.id === core.id) : [];
    const mentions = core ? mentionsForEntity(core.id) : [];

    const data = {
      entity: core
        ? {
            __typename: core.__typename,
            id: core.id,
            name: core.name,
            type: core.type,
            mentionCount: core.mentionCount,
            outgoing,
            incoming,
            mentions,
          }
        : null,
    };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('ListEntities', () => {
    const data = { entities: fixture.entities };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

