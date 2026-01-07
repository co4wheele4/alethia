// test/e2e/cross-cutting/pagination-edge-cases.e2e-spec.ts
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('Pagination Edge Cases (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();

    // Create multiple AI queries for pagination testing
    for (let i = 0; i < 5; i++) {
      await graphqlRequest(
        context.app,
        `
        mutation AskAi($userId: String!, $query: String!) {
          askAi(userId: $userId, query: $query) {
            id
          }
        }
      `,
        {
          userId: context.testData.user.id,
          query: `Pagination test query ${i}`,
        },
      );
    }
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('should handle pagination with skip=0 and take=0', async () => {
    const query = `
      query GetAiQueriesPaged($skip: Int, $take: Int) {
        aiQueriesPaged(skip: $skip, take: $take) {
          id
          query
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, { skip: 0, take: 0 });

    expect(res.status).toBe(200);
    expect(res.body?.data?.aiQueriesPaged).toBeInstanceOf(Array);
    // With take=0, should return empty array or handle gracefully
  });

  it('should handle pagination with very large skip value', async () => {
    const query = `
      query GetAiQueriesPaged($skip: Int, $take: Int) {
        aiQueriesPaged(skip: $skip, take: $take) {
          id
          query
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, {
      skip: 1000000,
      take: 10,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.aiQueriesPaged).toBeInstanceOf(Array);
    expect(res.body?.data?.aiQueriesPaged?.length).toBe(0);
  });

  it('should handle pagination with very large take value', async () => {
    const query = `
      query GetAiQueriesPaged($skip: Int, $take: Int) {
        aiQueriesPaged(skip: $skip, take: $take) {
          id
          query
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, {
      skip: 0,
      take: 1000000,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.aiQueriesPaged).toBeInstanceOf(Array);
    // Should return all available records, not crash
  });
});
