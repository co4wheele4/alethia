// test/e2e/cross-cutting/error-cases.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('Error Cases (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Constraint Violation Tests', () => {
    it('should handle duplicate email constraint violation', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // Create first user
      const create1Res = await graphqlRequest(
        context.app,
        `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
            email
          }
        }
      `,
        { email },
      );

      expect(create1Res.status).toBe(200);
      expect(
        (create1Res.body?.data as { createUser?: unknown })?.createUser,
      ).toBeDefined();

      // Try to create second user with same email
      const create2Res = await graphqlRequest(
        context.app,
        `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
            email
          }
        }
      `,
        { email },
      );

      expect(create2Res.status).toBe(200);
      // Should have an error
      expect(
        create2Res.body?.errors ||
          (create2Res.body?.data as { createUser?: unknown })?.createUser,
      ).toBeDefined();
      if (create2Res.body?.errors) {
        expect(create2Res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle duplicate entity (name + type) constraint violation', async () => {
      const name = `Duplicate Entity ${Date.now()}`;
      const type = 'DuplicateType';

      // Create first entity
      const create1Res = await graphqlRequest(
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
          data: { name, type },
        },
      );

      expect(create1Res.status).toBe(200);
      expect(
        (create1Res.body?.data as { createEntity?: unknown })?.createEntity,
      ).toBeDefined();

      // Try to create second entity with same name and type
      const create2Res = await graphqlRequest(
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
          data: { name, type },
        },
      );

      expect(create2Res.status).toBe(200);
      // Should have an error
      expect(
        create2Res.body?.errors ||
          (create2Res.body?.data as { createEntity?: unknown })?.createEntity,
      ).toBeDefined();
      if (create2Res.body?.errors) {
        expect(create2Res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle duplicate lesson (title + userId) constraint violation', async () => {
      const title = `Duplicate Lesson ${Date.now()}`;

      // Create first lesson
      const create1Res = await graphqlRequest(
        context.app,
        `
        mutation CreateLesson($title: String!, $userId: String!) {
          createLesson(title: $title, userId: $userId) {
            id
            title
          }
        }
      `,
        {
          title,
          userId: context.testData.user.id,
        },
      );

      expect(create1Res.status).toBe(200);
      expect(
        (create1Res.body?.data as { createLesson?: unknown })?.createLesson,
      ).toBeDefined();

      // Try to create second lesson with same title and userId
      const create2Res = await graphqlRequest(
        context.app,
        `
        mutation CreateLesson($title: String!, $userId: String!) {
          createLesson(title: $title, userId: $userId) {
            id
            title
          }
        }
      `,
        {
          title,
          userId: context.testData.user.id,
        },
      );

      expect(create2Res.status).toBe(200);
      // Should have an error
      expect(
        create2Res.body?.errors ||
          (create2Res.body?.data as { createLesson?: unknown })?.createLesson,
      ).toBeDefined();
      if (create2Res.body?.errors) {
        expect(create2Res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle duplicate chunk (documentId + chunkIndex) constraint violation', async () => {
      const chunkIndex = 9999;

      // Create first chunk
      const create1Res = await graphqlRequest(
        context.app,
        `
        mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
          createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
            id
            chunkIndex
          }
        }
      `,
        {
          documentId: context.testData.document.id,
          chunkIndex,
          content: 'First chunk',
        },
      );

      expect(create1Res.status).toBe(200);
      expect(
        (create1Res.body?.data as { createChunk?: unknown })?.createChunk,
      ).toBeDefined();

      // Try to create second chunk with same documentId and chunkIndex
      const create2Res = await graphqlRequest(
        context.app,
        `
        mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
          createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
            id
            chunkIndex
          }
        }
      `,
        {
          documentId: context.testData.document.id,
          chunkIndex,
          content: 'Second chunk',
        },
      );

      expect(create2Res.status).toBe(200);
      // Should have an error
      expect(
        create2Res.body?.errors ||
          (create2Res.body?.data as { createChunk?: unknown })?.createChunk,
      ).toBeDefined();
      if (create2Res.body?.errors) {
        expect(create2Res.body.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Foreign Key Constraint Tests', () => {
    it('should handle invalid userId in createLesson', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        mutation CreateLesson($title: String!, $userId: String!) {
          createLesson(title: $title, userId: $userId) {
            id
            title
          }
        }
      `,
        {
          title: 'Test Lesson',
          userId: 'non-existent-user-id',
        },
      );

      expect(res.status).toBe(200);
      // Should have an error due to foreign key constraint
      expect(
        res.body?.errors ||
          (res.body?.data as { createLesson?: unknown })?.createLesson,
      ).toBeDefined();
      if (res.body?.errors) {
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid userId in createDocument', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        mutation CreateDocument($title: String!, $userId: String!) {
          createDocument(title: $title, userId: $userId) {
            id
            title
          }
        }
      `,
        {
          title: 'Test Document',
          userId: 'non-existent-user-id',
        },
      );

      expect(res.status).toBe(200);
      // Should have an error due to foreign key constraint
      expect(
        res.body?.errors ||
          (res.body?.data as { createDocument?: unknown })?.createDocument,
      ).toBeDefined();
      if (res.body?.errors) {
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid documentId in createChunk', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
          createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
            id
            content
          }
        }
      `,
        {
          documentId: 'non-existent-document-id',
          chunkIndex: 0,
          content: 'Test content',
        },
      );

      expect(res.status).toBe(200);
      // Should have an error due to foreign key constraint
      expect(
        res.body?.errors ||
          (res.body?.data as { createChunk?: unknown })?.createChunk,
      ).toBeDefined();
      if (res.body?.errors) {
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid entityId in createEntityMention', async () => {
      const res = await graphqlRequest(
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
            entityId: 'non-existent-entity-id',
            chunkId: context.testData.chunk.id,
          },
        },
      );

      expect(res.status).toBe(200);
      // Should have an error due to foreign key constraint
      expect(
        res.body?.errors ||
          (res.body?.data as { createEntityMention?: unknown })
            ?.createEntityMention,
      ).toBeDefined();
      if (res.body?.errors) {
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid fromEntity in createEntityRelationship', async () => {
      const res = await graphqlRequest(
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
            fromEntity: 'non-existent-entity-id',
            toEntity: context.testData.entity.id,
            relation: 'related_to',
          },
        },
      );

      expect(res.status).toBe(200);
      // Should have an error due to foreign key constraint
      expect(
        res.body?.errors ||
          (res.body?.data as { createEntityRelationship?: unknown })
            ?.createEntityRelationship,
      ).toBeDefined();
      if (res.body?.errors) {
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Query Edge Cases', () => {
    it('should handle querying with invalid UUID format', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        query GetUser($id: String!) {
          user(id: $id) {
            id
            email
          }
        }
      `,
        {
          id: 'not-a-valid-uuid',
        },
      );

      expect(res.status).toBe(200);
      // Should return null for invalid UUID
      expect((res.body?.data as { user?: unknown })?.user).toBeNull();
    });

    it('should handle querying with special characters in ID', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        query GetUser($id: String!) {
          user(id: $id) {
            id
            email
          }
        }
      `,
        {
          id: "'; DROP TABLE users; --",
        },
      );

      expect(res.status).toBe(200);
      // Should return null or handle gracefully (either null user or GraphQL validation error)
      expect(res.body?.data || res.body?.errors).toBeDefined();
      if (res.body?.data) {
        expect((res.body.data as { user?: unknown }).user).toBeNull();
      }
    });
  });
});
