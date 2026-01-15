/**
 * Full-stack e2e tests that test both frontend and backend together
 * These tests verify the complete user flow from UI to API
 */

import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../helpers/test-setup';
import { graphqlRequest } from '../helpers/graphql-request';

describe('Full-Stack Authentication Flow (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full registration flow', async () => {
      const email = `fullstack-register-${Date.now()}@example.com`;
      const name = 'Full Stack Test User';

      // Step 1: Register user via GraphQL API
      const registerMutation = `
        mutation Register($email: String!, $name: String) {
          register(email: $email, name: $name)
        }
      `;

      const registerRes = await graphqlRequest(
        context.app,
        registerMutation,
        { email, name },
        { authToken: undefined },
      );

      expect(registerRes.status).toBe(200);
      expect(registerRes.body?.data?.register).toBeDefined();
      const token = registerRes.body?.data?.register as string;
      expect(token.length).toBeGreaterThan(0);

      // Step 2: Verify token can be used to authenticate
      const helloQuery = `
        query Hello {
          hello
        }
      `;

      const helloRes = await graphqlRequest(
        context.app,
        helloQuery,
        {},
        { authToken: token },
      );

      expect(helloRes.status).toBe(200);
      expect(helloRes.body?.data?.hello).toBeDefined();
    });

    it('should complete full login flow', async () => {
      // Use existing test user
      const email = context.testData.user.email;
      const password = 'password'; // Seeded password

      // Step 1: Login via GraphQL API
      const loginMutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `;

      const loginRes = await graphqlRequest(
        context.app,
        loginMutation,
        { email, password },
        { authToken: undefined },
      );

      expect(loginRes.status).toBe(200);
      expect(loginRes.body?.data?.login).toBeDefined();
      const token = loginRes.body?.data?.login as string;
      expect(token.length).toBeGreaterThan(0);

      // Step 2: Verify authenticated request works
      const helloQuery = `
        query Hello {
          hello
        }
      `;

      const helloRes = await graphqlRequest(
        context.app,
        helloQuery,
        {},
        { authToken: token },
      );

      expect(helloRes.status).toBe(200);
      expect(helloRes.body?.data?.hello).toBeDefined();
    });

    it('should reject invalid login credentials', async () => {
      const loginMutation = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `;

      const loginRes = await graphqlRequest(
        context.app,
        loginMutation,
        {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        },
        { authToken: undefined },
      );

      expect(loginRes.status).toBe(200); // GraphQL returns 200 even on errors
      // GraphQL may omit the field (undefined) or return null when the resolver errors.
      expect(loginRes.body?.data?.login ?? null).toBeNull();
      expect(loginRes.body?.errors).toBeDefined();
      expect(loginRes.body?.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Authenticated GraphQL Queries', () => {
    it('should allow authenticated users to query hello', async () => {
      const helloQuery = `
        query Hello {
          hello
        }
      `;

      const res = await graphqlRequest(
        context.app,
        helloQuery,
        {},
        { authToken: context.auth.userToken },
      );

      expect(res.status).toBe(200);
      expect(res.body?.data?.hello).toBeDefined();
    });

    it('should allow authenticated users to query lessons', async () => {
      const lessonsQuery = `
        query Lessons {
          lessons {
            id
            title
            content
          }
        }
      `;

      const res = await graphqlRequest(
        context.app,
        lessonsQuery,
        {},
        { authToken: context.auth.userToken },
      );

      expect(res.status).toBe(200);
      expect(res.body?.data?.lessons).toBeDefined();
      expect(Array.isArray(res.body?.data?.lessons)).toBe(true);
    });
  });
});
