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
      const entity1Data = entity1Res.body?.data as {
        createEntity?: { id?: string };
      };
      entityId = entity1Data?.createEntity?.id || '';

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
      const entity2Data = entity2Res.body?.data as {
        createEntity?: { id?: string };
      };
      entity2Id = entity2Data?.createEntity?.id || '';

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
      const mentionData = mentionRes.body?.data as {
        createEntityMention?: { id?: string };
      };
      mentionId = mentionData?.createEntityMention?.id || '';

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
      const relData = relRes.body?.data as {
        createEntityRelationship?: { id?: string };
      };
      relationshipId = relData?.createEntityRelationship?.id || '';
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
      const data = res.body?.data as {
        entity?: {
          id?: string;
          mentions?: Array<{
            id?: string;
            entity?: unknown;
            chunk?: unknown;
          }>;
        };
      };
      expect(data?.entity).toBeDefined();
      expect(data?.entity?.mentions).toBeInstanceOf(Array);
      expect(data?.entity?.mentions?.length).toBeGreaterThan(0);
      expect(data?.entity?.mentions?.[0]?.id).toBe(mentionId);
      expect(data?.entity?.mentions?.[0]?.entity).toBeDefined();
      expect(data?.entity?.mentions?.[0]?.chunk).toBeDefined();
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
      const data = res.body?.data as {
        entity?: {
          id?: string;
          outgoing?: Array<{
            id?: string;
            relation?: string;
            from?: unknown;
            to?: unknown;
          }>;
        };
      };
      expect(data?.entity).toBeDefined();
      expect(data?.entity?.outgoing).toBeInstanceOf(Array);
      expect(data?.entity?.outgoing?.length).toBeGreaterThan(0);
      expect(data?.entity?.outgoing?.[0]?.id).toBe(relationshipId);
      expect(data?.entity?.outgoing?.[0]?.relation).toBe('related_to');
      expect(data?.entity?.outgoing?.[0]?.from).toBeDefined();
      expect(data?.entity?.outgoing?.[0]?.to).toBeDefined();
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
      const data = res.body?.data as {
        entity?: {
          id?: string;
          incoming?: Array<{
            id?: string;
            relation?: string;
            from?: unknown;
            to?: unknown;
          }>;
        };
      };
      expect(data?.entity).toBeDefined();
      expect(data?.entity?.incoming).toBeInstanceOf(Array);
      expect(data?.entity?.incoming?.length).toBeGreaterThan(0);
      expect(data?.entity?.incoming?.[0]?.id).toBe(relationshipId);
      expect(data?.entity?.incoming?.[0]?.relation).toBe('related_to');
      expect(data?.entity?.incoming?.[0]?.from).toBeDefined();
      expect(data?.entity?.incoming?.[0]?.to).toBeDefined();
    });
  });
});
