// test/e2e/resolvers/ai-query.resolver.e2e-spec.ts
import { setupTestApp, teardownTestApp, TestContext } from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('AiQueryResolver (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('ResolveFields', () => {
    let aiQueryId: string;
    let resultId: string;

    beforeAll(async () => {
      // Create an AI query
      const queryRes = await graphqlRequest(context.app, `
        mutation AskAi($userId: String!, $query: String!) {
          askAi(userId: $userId, query: $query) {
            id
            query {
              id
            }
          }
        }
      `, {
        userId: context.testData.user.id,
        query: 'Test query for ResolveField testing',
      });
      aiQueryId = queryRes.body?.data?.askAi?.query?.id;
      resultId = queryRes.body?.data?.askAi?.id;
    });

    it('should directly resolve aiQuery user with full data', async () => {
      const query = `
        query GetAiQueryUser($id: String!) {
          aiQuery(id: $id) {
            id
            query
            user {
              id
              email
              name
              documents {
                id
              }
              lessons {
                id
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: aiQueryId });

      expect(res.status).toBe(200);
      expect(res.body?.data?.aiQuery).toBeDefined();
      expect(res.body?.data?.aiQuery?.user).toBeDefined();
      expect(res.body?.data?.aiQuery?.user?.id).toBe(context.testData.user.id);
      expect(res.body?.data?.aiQuery?.user?.email).toBe(context.testData.user.email);
      expect(res.body?.data?.aiQuery?.user?.documents).toBeInstanceOf(Array);
      expect(res.body?.data?.aiQuery?.user?.lessons).toBeInstanceOf(Array);
    });

    it('should directly resolve aiQuery results with full data', async () => {
      const query = `
        query GetAiQueryResults($id: String!) {
          aiQuery(id: $id) {
            id
            query
            results {
              id
              answer
              score
              query {
                id
                query
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: aiQueryId });

      expect(res.status).toBe(200);
      expect(res.body?.data?.aiQuery).toBeDefined();
      expect(res.body?.data?.aiQuery?.results).toBeInstanceOf(Array);
      expect(res.body?.data?.aiQuery?.results?.length).toBeGreaterThan(0);
      expect(res.body?.data?.aiQuery?.results[0]?.id).toBe(resultId);
      expect(res.body?.data?.aiQuery?.results[0]?.answer).toBeDefined();
      expect(res.body?.data?.aiQuery?.results[0]?.score).toBeDefined();
      expect(res.body?.data?.aiQuery?.results[0]?.query).toBeDefined();
    });
  });

  describe('AiQueryResult Queries', () => {
    let resultId: string;

    beforeAll(async () => {
      // Create an AI query result
      const queryRes = await graphqlRequest(context.app, `
        mutation AskAi($userId: String!, $query: String!) {
          askAi(userId: $userId, query: $query) {
            id
          }
        }
      `, {
        userId: context.testData.user.id,
        query: 'Test query for direct result query',
      });
      resultId = queryRes.body?.data?.askAi?.id;
    });

    it('should directly query aiQueryResult by id with full nested data', async () => {
      const query = `
        query GetAiQueryResult($id: String!) {
          aiQueryResult(id: $id) {
            id
            answer
            score
            query {
              id
              query
              user {
                id
                email
              }
              results {
                id
              }
            }
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: resultId });

      expect(res.status).toBe(200);
      expect(res.body?.data?.aiQueryResult).toBeDefined();
      expect(res.body?.data?.aiQueryResult?.id).toBe(resultId);
      expect(res.body?.data?.aiQueryResult?.answer).toBeDefined();
      expect(res.body?.data?.aiQueryResult?.score).toBeDefined();
      expect(res.body?.data?.aiQueryResult?.query).toBeDefined();
      expect(res.body?.data?.aiQueryResult?.query?.user).toBeDefined();
      expect(res.body?.data?.aiQueryResult?.query?.results).toBeInstanceOf(Array);
    });

    it('should return null for non-existent aiQueryResult', async () => {
      const query = `
        query GetAiQueryResult($id: String!) {
          aiQueryResult(id: $id) {
            id
          }
        }
      `;
      const res = await graphqlRequest(context.app, query, { id: 'non-existent-id' });

      expect(res.status).toBe(200);
      expect(res.body?.data?.aiQueryResult).toBeNull();
    });
  });
});

