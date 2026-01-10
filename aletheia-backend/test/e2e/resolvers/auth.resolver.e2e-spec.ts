// test/e2e/resolvers/auth.resolver.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('AuthResolver (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const mutation = `
        mutation Register($email: String!, $name: String) {
          register(email: $email, name: $name)
        }
      `;
      const variables = {
        email: `register-test-${Date.now()}@example.com`,
        name: 'New User',
      };
      const res = await graphqlRequest(
        context.app,
        mutation,
        variables,
        { authToken: undefined }, // No auth required for register
      );

      expect(res.status).toBe(200);
      expect(res.body?.data?.register).toBeDefined();
      expect(typeof res.body?.data?.register).toBe('string');
      expect((res.body?.data?.register as string).length).toBeGreaterThan(0);
    });

    it('should register a user without name', async () => {
      const mutation = `
        mutation Register($email: String!) {
          register(email: $email)
        }
      `;
      const variables = {
        email: `register-no-name-${Date.now()}@example.com`,
      };
      const res = await graphqlRequest(
        context.app,
        mutation,
        variables,
        { authToken: undefined }, // No auth required for register
      );

      expect(res.status).toBe(200);
      expect(res.body?.data?.register).toBeDefined();
      expect(typeof res.body?.data?.register).toBe('string');
      expect((res.body?.data?.register as string).length).toBeGreaterThan(0);
    });

    it('should throw error when registering with existing email', async () => {
      const mutation = `
        mutation Register($email: String!) {
          register(email: $email)
        }
      `;
      const variables = {
        email: context.testData.user.email, // Use existing user's email
      };
      const res = await graphqlRequest(
        context.app,
        mutation,
        variables,
        { authToken: undefined }, // No auth required for register
      );

      expect(res.status).toBe(200);
      // GraphQL returns errors in errors array, data may be null or undefined
      expect(res.body?.errors).toBeDefined();
      expect(Array.isArray(res.body?.errors)).toBe(true);
      expect(res.body?.errors?.length).toBeGreaterThan(0);
      const errorMessage = res.body?.errors?.[0]?.message || '';
      expect(errorMessage).toMatch(/already exists|Invalid|credentials/i);
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return access token', async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `;
      const variables = {
        email: context.testData.user.email,
        password: 'password', // Default password from test setup
      };
      const res = await graphqlRequest(
        context.app,
        mutation,
        variables,
        { authToken: undefined }, // No auth required for login
      );

      expect(res.status).toBe(200);
      expect(res.body?.data?.login).toBeDefined();
      expect(typeof res.body?.data?.login).toBe('string');
      expect((res.body?.data?.login as string).length).toBeGreaterThan(0);
    });

    it('should throw error when login with non-existent email', async () => {
      const mutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `;
      const variables = {
        email: 'non-existent@example.com',
        password: 'password',
      };
      const res = await graphqlRequest(
        context.app,
        mutation,
        variables,
        { authToken: undefined }, // No auth required for login
      );

      expect(res.status).toBe(200);
      // GraphQL returns errors in errors array, data may be null or undefined
      expect(res.body?.errors).toBeDefined();
      expect(Array.isArray(res.body?.errors)).toBe(true);
      expect(res.body?.errors?.length).toBeGreaterThan(0);
      const errorMessage = res.body?.errors?.[0]?.message || '';
      expect(errorMessage).toMatch(/Invalid credentials|Unauthorized/i);
    });
  });
});
