// test/e2e/resolvers/app.resolver.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('AppResolver (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Queries', () => {
    it('should return hello message', async () => {
      const query = `query { hello }`;
      const res = await graphqlRequest(context.app, query);

      expect(res.status).toBe(200);
      expect(res.body?.data?.hello).toBe('Hello, Aletheia!');
    });

    it('should fetch lessons', async () => {
      const query = `
        query {
          lessons {
            id
            title
            content
          }
        }
      `;
      const res = await graphqlRequest(context.app, query);

      expect(res.status).toBe(200);
      expect(res.body?.data?.lessons).toBeInstanceOf(Array);
    });
  });

  describe('Mutations', () => {
    it('should create AI query via askAI', async () => {
      const mutation = `
        mutation AskAI($userId: String!, $query: String!) {
          askAI(userId: $userId, query: $query)
        }
      `;
      const variables = {
        userId: context.testData.user.id,
        query: 'What is Aletheia?',
      };
      const res = await graphqlRequest(context.app, mutation, variables);

      expect(res.status).toBe(200);
      expect(res.body?.data?.askAI).toBeDefined();
    });
  });
});
