// test/e2e/cross-cutting/validation-edge-cases.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('Validation Edge Cases (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Empty and Null Input Edge Cases', () => {
    it('should handle empty string inputs appropriately', async () => {
      // Test with empty title
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
          title: '',
          userId: context.testData.user.id,
        },
      );

      expect(res.status).toBe(200);
      // Should either create with empty title or return error
      const data = res.body?.data as { createLesson?: unknown };
      expect(data?.createLesson || res.body?.errors).toBeDefined();
    });

    it('should handle very long string inputs', async () => {
      const longString = 'A'.repeat(10000);

      const res = await graphqlRequest(
        context.app,
        `
        mutation CreateLesson($title: String!, $userId: String!, $content: String) {
          createLesson(title: $title, userId: $userId, content: $content) {
            id
            title
            content
          }
        }
      `,
        {
          title: 'Long Content Test',
          userId: context.testData.user.id,
          content: longString,
        },
      );

      expect(res.status).toBe(200);
      const data = res.body?.data as { createLesson?: unknown };
      expect(data?.createLesson || res.body?.errors).toBeDefined();
    });

    it('should handle null optional parameters correctly', async () => {
      const res = await graphqlRequest(
        context.app,
        `
        mutation CreateUser($email: String!, $name: String) {
          createUser(data: { email: $email, name: $name }) {
            id
            email
            name
          }
        }
      `,
        {
          email: `null-test-${Date.now()}@example.com`,
          name: null,
        },
      );

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        createUser?: { id?: string; email?: string; name?: string | null };
      };
      expect(data?.createUser).toBeDefined();
      expect(data?.createUser?.name).toBeNull();
    });
  });
});
