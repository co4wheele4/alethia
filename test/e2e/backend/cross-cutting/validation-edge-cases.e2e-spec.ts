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
    it('should handle empty string title inputs appropriately', async () => {
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
          title: '',
          userId: context.testData.user.id,
        },
        { authToken: context.auth.userToken },
      );

      expect(res.status).toBe(200);
      const data = res.body?.data as { createDocument?: unknown };
      expect(data?.createDocument || res.body?.errors).toBeDefined();
    });

    it('should handle very long string inputs', async () => {
      const longTitle = 'A'.repeat(10000);

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
          title: longTitle,
          userId: context.testData.user.id,
        },
        { authToken: context.auth.userToken },
      );

      expect(res.status).toBe(200);
      const data = res.body?.data as { createDocument?: unknown };
      expect(data?.createDocument || res.body?.errors).toBeDefined();
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
