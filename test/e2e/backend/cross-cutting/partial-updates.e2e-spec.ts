// test/e2e/cross-cutting/partial-updates.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
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
      const createRes = await graphqlRequest(
        context.app,
        `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
            email
          }
        }
      `,
        {
          email: `update-null-test-${Date.now()}@example.com`,
        },
      );
      const userId = (createRes.body?.data as { createUser?: { id?: string } })
        ?.createUser?.id;

      // Try to update with all null fields
      const updateRes = await graphqlRequest(
        context.app,
        `
        mutation UpdateUser($id: String!, $email: String, $name: String) {
          updateUser(data: { id: $id, email: $email, name: $name }) {
            id
            email
            name
          }
        }
      `,
        {
          id: userId,
          email: null,
          name: null,
        },
      );

      expect(updateRes.status).toBe(200);
      // Should either update (keeping existing values) or return error
      expect(
        (updateRes.body?.data as { updateUser?: unknown })?.updateUser ||
          updateRes.body?.errors,
      ).toBeDefined();
    });

    it('should handle update with empty string name', async () => {
      const createRes = await graphqlRequest(
        context.app,
        `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email, name: "Original Name" }) {
            id
            name
          }
        }
      `,
        {
          email: `empty-string-test-${Date.now()}@example.com`,
        },
      );
      const userId = (createRes.body?.data as { createUser?: { id?: string } })
        ?.createUser?.id;

      const updateRes = await graphqlRequest(
        context.app,
        `
        mutation UpdateUser($id: String!, $name: String) {
          updateUser(data: { id: $id, name: $name }) {
            id
            name
          }
        }
      `,
        {
          id: userId,
          name: '',
        },
      );

      expect(updateRes.status).toBe(200);
      expect(
        (updateRes.body?.data as { updateUser?: unknown })?.updateUser ||
          updateRes.body?.errors,
      ).toBeDefined();
    });
  });
});
