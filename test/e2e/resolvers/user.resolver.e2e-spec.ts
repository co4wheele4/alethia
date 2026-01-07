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
      expect(res.body?.data?.users).toBeInstanceOf(Array);
      expect(res.body?.data?.users?.length).toBeGreaterThan(0);
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
      expect(res.body?.data?.user).toBeDefined();
      expect(res.body?.data?.user?.id).toBe(context.testData.user.id);
      expect(res.body?.data?.user?.email).toBe(context.testData.user.email);
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
      expect(res.body?.data?.user).toBeNull();
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
      expect(res.body?.data?.createUser).toBeDefined();
      expect(res.body?.data?.createUser?.email).toBe(variables.email);
      expect(res.body?.data?.createUser?.name).toBe(variables.name);
      createdUserId = res.body?.data?.createUser?.id;
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
      expect(res.body?.data?.createUser).toBeDefined();
      expect(res.body?.data?.createUser?.email).toBe(variables.email);
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
        createdUserId = createRes.body?.data?.createUser?.id;
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
      expect(res.body?.data?.updateUser).toBeDefined();
      expect(res.body?.data?.updateUser?.email).toBe(variables.email);
      expect(res.body?.data?.updateUser?.name).toBe(variables.name);
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
      const userIdToDelete = createRes.body?.data?.createUser?.id;

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
      expect(res.body?.data?.deleteUser).toBeDefined();
      expect(res.body?.data?.deleteUser?.id).toBe(userIdToDelete);
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
      expect(res.body?.data?.user).toBeDefined();
      expect(res.body?.data?.user?.documents).toBeInstanceOf(Array);
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
      expect(res.body?.data?.user).toBeDefined();
      expect(res.body?.data?.user?.lessons).toBeInstanceOf(Array);
    });

    it('should resolve user aiQueries', async () => {
      const query = `
        query GetUserWithAiQueries($id: String!) {
          user(id: $id) {
            id
            aiQueries {
              id
              query
            }
          }
        }
      `;
      const variables = { id: context.testData.user.id };
      const res = await graphqlRequest(context.app, query, variables);

      expect(res.status).toBe(200);
      expect(res.body?.data?.user).toBeDefined();
      expect(res.body?.data?.user?.aiQueries).toBeInstanceOf(Array);
    });
  });
});
