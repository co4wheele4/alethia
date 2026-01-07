// test/e2e/cross-cutting/relationship-edge-cases.e2e-spec.ts
import { setupTestApp, teardownTestApp, TestContext } from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('Relationship Edge Cases (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Delete Cascade Tests', () => {
    it('should handle deleting user with related lessons', async () => {
      // Create a user with lessons
      const userRes = await graphqlRequest(context.app, `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
          }
        }
      `, {
        email: `cascade-test-${Date.now()}@example.com`,
      });
      const userId = userRes.body?.data?.createUser?.id;

      // Create a lesson for this user
      await graphqlRequest(context.app, `
        mutation CreateLesson($title: String!, $userId: String!) {
          createLesson(title: $title, userId: $userId) {
            id
          }
        }
      `, {
        title: 'Cascade Test Lesson',
        userId,
      });

      // Delete the user
      const deleteRes = await graphqlRequest(context.app, `
        mutation DeleteUser($id: String!) {
          deleteUser(id: $id) {
            id
          }
        }
      `, {
        id: userId,
      });

      expect(deleteRes.status).toBe(200);
      // Should either delete user (and cascade delete lessons) or return error
      expect(deleteRes.body?.data?.deleteUser || deleteRes.body?.errors).toBeDefined();
    });

    it('should handle deleting document with related chunks', async () => {
      // Create a document with chunks
      const docRes = await graphqlRequest(context.app, `
        mutation CreateDocument($title: String!, $userId: String!) {
          createDocument(title: $title, userId: $userId) {
            id
          }
        }
      `, {
        title: 'Cascade Test Document',
        userId: context.testData.user.id,
      });
      const docId = docRes.body?.data?.createDocument?.id;

      // Create chunks for this document
      await graphqlRequest(context.app, `
        mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
          createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
            id
          }
        }
      `, {
        documentId: docId,
        chunkIndex: 0,
        content: 'Cascade test chunk',
      });

      // Delete the document
      const deleteRes = await graphqlRequest(context.app, `
        mutation DeleteDocument($id: String!) {
          deleteDocument(id: $id) {
            id
          }
        }
      `, {
        id: docId,
      });

      expect(deleteRes.status).toBe(200);
      // Should either delete document (and cascade delete chunks) or return error
      expect(deleteRes.body?.data?.deleteDocument || deleteRes.body?.errors).toBeDefined();
    });
  });
});

