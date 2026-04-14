// test/e2e/resolvers/user.resolver.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('UserResolver (e2e)', () => {
  let context: TestContext;
  let createdUserId: string;
  let createdUserEmail: string;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Queries', () => {
    it('should fetch all users', async () => {
      const query = `
        query {
          users {
            id
            email
            name
          }
        }
      `;
      const res = await graphqlRequest(context.app, query);

      expect(res.status).toBe(200);
      expect((res.body?.data as { users?: unknown[] })?.users).toBeInstanceOf(
        Array,
      );
      expect(
        (res.body?.data as { users?: unknown[] })?.users?.length,
      ).toBeGreaterThan(0);
    });

    it('should fetch user by id', async () => {
      const query = `
        query GetUser($id: String!) {
          user(id: $id) {
            id
            email
            name
          }
        }
      `;
      const variables = { id: context.testData.user.id };
      const res = await graphqlRequest(context.app, query, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as { user?: { id?: string; email?: string } };
      expect(data?.user).toBeDefined();
      expect(data?.user?.id).toBe(context.testData.user.id);
      expect(data?.user?.email).toBe(context.testData.user.email);
    });

    it('should return null for non-existent user', async () => {
      const query = `
        query GetUser($id: String!) {
          user(id: $id) {
            id
            email
          }
        }
      `;
      const variables = { id: 'non-existent-id' };
      const res = await graphqlRequest(context.app, query, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as { user?: null };
      expect(data?.user).toBeNull();
    });
  });

  describe('Mutations', () => {
    it('should create a user', async () => {
      const mutation = `
        mutation CreateUser($email: String!, $name: String) {
          createUser(data: { email: $email, name: $name }) {
            id
            email
            name
          }
        }
      `;
      createdUserEmail = `test-${Date.now()}@example.com`;
      const variables = {
        email: createdUserEmail,
        name: 'Test User',
      };
      const res = await graphqlRequest(context.app, mutation, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        createUser?: { id?: string; email?: string; name?: string };
      };
      expect(data?.createUser).toBeDefined();
      expect(data?.createUser?.email).toBe(variables.email);
      expect(data?.createUser?.name).toBe(variables.name);
      createdUserId = data?.createUser?.id || '';
    });

    it('should create user without name', async () => {
      const mutation = `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
            email
            name
          }
        }
      `;
      const variables = {
        email: `test-${Date.now()}@example.com`,
      };
      const res = await graphqlRequest(context.app, mutation, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        createUser?: { id?: string; email?: string; name?: string };
      };
      expect(data?.createUser).toBeDefined();
      expect(data?.createUser?.email).toBe(variables.email);
    });

    it('should update user', async () => {
      if (!createdUserId) {
        // Create a user first if not created
        const createMutation = `
          mutation CreateUser($email: String!) {
            createUser(data: { email: $email }) {
              id
            }
          }
        `;
        const createRes = await graphqlRequest(context.app, createMutation, {
          email: `update-test-${Date.now()}@example.com`,
        });
        const createData = createRes.body?.data as {
          createUser?: { id?: string };
        };
        createdUserId = createData?.createUser?.id || '';
      }

      const mutation = `
        mutation UpdateUser($id: String!, $email: String, $name: String) {
          updateUser(data: { id: $id, email: $email, name: $name }) {
            id
            email
            name
          }
        }
      `;
      const variables = {
        id: createdUserId,
        email: `updated-${Date.now()}@example.com`,
        name: 'Updated Name',
      };
      const res = await graphqlRequest(context.app, mutation, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        updateUser?: { id?: string; email?: string; name?: string };
      };
      expect(data?.updateUser).toBeDefined();
      expect(data?.updateUser?.email).toBe(variables.email);
      expect(data?.updateUser?.name).toBe(variables.name);
    });

    it('should delete user', async () => {
      // Create a user to delete
      const createMutation = `
        mutation CreateUser($email: String!) {
          createUser(data: { email: $email }) {
            id
          }
        }
      `;
      const createRes = await graphqlRequest(context.app, createMutation, {
        email: `delete-test-${Date.now()}@example.com`,
      });
      const createData = createRes.body?.data as {
        createUser?: { id?: string };
      };
      const userIdToDelete = createData?.createUser?.id || '';

      const mutation = `
        mutation DeleteUser($id: String!) {
          deleteUser(id: $id) {
            id
            email
          }
        }
      `;
      const variables = { id: userIdToDelete };
      const res = await graphqlRequest(context.app, mutation, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        deleteUser?: { id?: string; email?: string };
      };
      expect(data?.deleteUser).toBeDefined();
      expect(data?.deleteUser?.id).toBe(userIdToDelete);
    });
  });

  describe('ResolveFields', () => {
    it('should resolve user documents', async () => {
      const query = `
        query GetUserWithDocuments($id: String!) {
          user(id: $id) {
            id
            email
            documents {
              id
              title
            }
          }
        }
      `;
      const variables = { id: context.testData.user.id };
      const res = await graphqlRequest(context.app, query, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        user?: { id?: string; email?: string; documents?: unknown[] };
      };
      expect(data?.user).toBeDefined();
      expect(data?.user?.documents).toBeInstanceOf(Array);
    });

    it('should resolve user lessons', async () => {
      const query = `
        query GetUserWithLessons($id: String!) {
          user(id: $id) {
            id
            lessons {
              id
              title
            }
          }
        }
      `;
      const variables = { id: context.testData.user.id };
      const res = await graphqlRequest(context.app, query, variables);

      expect(res.status).toBe(200);
      const data = res.body?.data as {
        user?: { id?: string; lessons?: unknown[] };
      };
      expect(data?.user).toBeDefined();
      expect(data?.user?.lessons).toBeInstanceOf(Array);
    });
  });
});
