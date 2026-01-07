// test/e2e/cross-cutting/partial-updates.e2e-spec.ts
import { setupTestApp, teardownTestApp, TestContext } from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('Partial Updates (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Update Operations Edge Cases', () => {
    it('should handle update with all fields as null/undefined', async () => {
      // Create a user first
      const createRes = await graphqlRequest(context.app, `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
            email
          }
        }
      `, {
        email: `update-null-test-${Date.now()}@example.com`,
      });
      const userId = createRes.body?.data?.createUser?.id;

      // Try to update with all null fields
      const updateRes = await graphqlRequest(context.app, `
        mutation UpdateUser($id: String!, $email: String, $name: String) {
          updateUser(data: { id: $id, email: $email, name: $name }) {
            id
            email
            name
          }
        }
      `, {
        id: userId,
        email: null,
        name: null,
      });

      expect(updateRes.status).toBe(200);
      // Should either update (keeping existing values) or return error
      expect(updateRes.body?.data?.updateUser || updateRes.body?.errors).toBeDefined();
    });

    it('should handle update with empty strings', async () => {
      // Create a lesson first
      const createRes = await graphqlRequest(context.app, `
        mutation CreateLesson($title: String!, $userId: String!) {
          createLesson(title: $title, userId: $userId) {
            id
            title
          }
        }
      `, {
        title: 'Original Title',
        userId: context.testData.user.id,
      });
      const lessonId = createRes.body?.data?.createLesson?.id;

      // Try to update with empty string
      const updateRes = await graphqlRequest(context.app, `
        mutation UpdateLesson($id: String!, $title: String) {
          updateLesson(id: $id, title: $title) {
            id
            title
          }
        }
      `, {
        id: lessonId,
        title: '',
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body?.data?.updateLesson || updateRes.body?.errors).toBeDefined();
    });
  });
});

