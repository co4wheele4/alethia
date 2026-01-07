// test/e2e/resolvers/entity.resolver.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('EntityResolver (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('ResolveFields', () => {
    let entityId: string;
    let entity2Id: string;
    let mentionId: string;
    let relationshipId: string;

    beforeAll(async () => {
      // Create entities for testing
      const entity1Res = await graphqlRequest(
        context.app,
        `
        mutation CreateEntity($data: CreateEntityInput!) {
          createEntity(data: $data) {
            id
            name
            type
          }
        }
      `,
        {
          data: { name: 'Entity ResolveField Test', type: 'TestType' },
        },
      );
      entityId = entity1Res.body?.data?.createEntity?.id;

      const entity2Res = await graphqlRequest(
        context.app,
        `
        mutation CreateEntity($data: CreateEntityInput!) {
          createEntity(data: $data) {
            id
          }
        }
      `,
        {
          data: { name: 'Entity 2', type: 'TestType' },
        },
      );
      entity2Id = entity2Res.body?.data?.createEntity?.id;

      // Create a mention for the entity
      const mentionRes = await graphqlRequest(
        context.app,
        `
        mutation CreateEntityMention($data: CreateEntityMentionInput!) {
          createEntityMention(data: $data) {
            id
          }
        }
      `,
        {
          data: {
            entityId: entityId,
            chunkId: context.testData.chunk.id,
          },
        },
      );
      mentionId = mentionRes.body?.data?.createEntityMention?.id;

      // Create a relationship (outgoing from entity1, incoming to entity2)
      const relRes = await graphqlRequest(
        context.app,
        `
        mutation CreateEntityRelationship($data: CreateEntityRelationshipInput!) {
          createEntityRelationship(data: $data) {
            id
          }
        }
      `,
        {
          data: {
            fromEntity: entityId,
            toEntity: entity2Id,
            relation: 'related_to',
          },
        },
      );
      relationshipId = relRes.body?.data?.createEntityRelationship?.id;
    });

    it('should directly resolve entity mentions with full data', async () => {
      const query = `
        query GetEntityMentions($id: String!) {
          entity(id: $id) {
            id
            name
            mentions {
              id
              entity {
                id
                name
              }
              chunk {
                id
                content
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: entityId });

      expect(res.status).toBe(200);
      expect(res.body?.data?.entity).toBeDefined();
      expect(res.body?.data?.entity?.mentions).toBeInstanceOf(Array);
      expect(res.body?.data?.entity?.mentions?.length).toBeGreaterThan(0);
      expect(res.body?.data?.entity?.mentions[0]?.id).toBe(mentionId);
      expect(res.body?.data?.entity?.mentions[0]?.entity).toBeDefined();
      expect(res.body?.data?.entity?.mentions[0]?.chunk).toBeDefined();
    });

    it('should directly resolve entity outgoing relationships with full data', async () => {
      const query = `
        query GetEntityOutgoing($id: String!) {
          entity(id: $id) {
            id
            name
            outgoing {
              id
              relation
              from {
                id
                name
              }
              to {
                id
                name
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: entityId });

      expect(res.status).toBe(200);
      expect(res.body?.data?.entity).toBeDefined();
      expect(res.body?.data?.entity?.outgoing).toBeInstanceOf(Array);
      expect(res.body?.data?.entity?.outgoing?.length).toBeGreaterThan(0);
      expect(res.body?.data?.entity?.outgoing[0]?.id).toBe(relationshipId);
      expect(res.body?.data?.entity?.outgoing[0]?.relation).toBe('related_to');
      expect(res.body?.data?.entity?.outgoing[0]?.from).toBeDefined();
      expect(res.body?.data?.entity?.outgoing[0]?.to).toBeDefined();
    });

    it('should directly resolve entity incoming relationships with full data', async () => {
      const query = `
        query GetEntityIncoming($id: String!) {
          entity(id: $id) {
            id
            name
            incoming {
              id
              relation
              from {
                id
                name
              }
              to {
                id
                name
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: entity2Id });

      expect(res.status).toBe(200);
      expect(res.body?.data?.entity).toBeDefined();
      expect(res.body?.data?.entity?.incoming).toBeInstanceOf(Array);
      expect(res.body?.data?.entity?.incoming?.length).toBeGreaterThan(0);
      expect(res.body?.data?.entity?.incoming[0]?.id).toBe(relationshipId);
      expect(res.body?.data?.entity?.incoming[0]?.relation).toBe('related_to');
      expect(res.body?.data?.entity?.incoming[0]?.from).toBeDefined();
      expect(res.body?.data?.entity?.incoming[0]?.to).toBeDefined();
    });
  });
});
