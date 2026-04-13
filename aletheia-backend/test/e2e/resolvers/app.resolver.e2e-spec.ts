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
      expect((res.body?.data as { hello?: string })?.hello).toBe(
        'Hello, Aletheia!',
      );
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
      expect(
        (res.body?.data as { lessons?: unknown[] })?.lessons,
      ).toBeInstanceOf(Array);
    });
  });
});
