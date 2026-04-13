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

    // Extra documents for pagination (seed already has one document).
    for (let i = 0; i < 5; i++) {
      await context.prisma.document.create({
        data: {
          title: `Pagination edge doc ${i}`,
          userId: context.testData.user.id,
        },
      });
    }
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('should handle pagination with limit and offset', async () => {
    const query = `
      query Docs($limit: Int!, $offset: Int!) {
        documents(limit: $limit, offset: $offset) {
          id
          title
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, {
      limit: 1,
      offset: 0,
    });

    expect(res.status).toBe(200);
    expect(
      (res.body?.data as { documents?: unknown[] })?.documents,
    ).toBeInstanceOf(Array);
  });

  it('should handle pagination with very large offset', async () => {
    const query = `
      query Docs($limit: Int!, $offset: Int!) {
        documents(limit: $limit, offset: $offset) {
          id
          title
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, {
      limit: 10,
      offset: 1000000,
    });

    expect(res.status).toBe(200);
    const docs = (res.body?.data as { documents?: unknown[] })?.documents;
    expect(docs).toBeInstanceOf(Array);
    expect(docs?.length).toBe(0);
  });

  it('should handle large limit without crashing', async () => {
    const query = `
      query Docs($limit: Int!, $offset: Int!) {
        documents(limit: $limit, offset: $offset) {
          id
          title
        }
      }
    `;
    const res = await graphqlRequest(context.app, query, {
      limit: 200,
      offset: 0,
    });

    expect(res.status).toBe(200);
    expect(
      (res.body?.data as { documents?: unknown[] })?.documents,
    ).toBeInstanceOf(Array);
  });
});
