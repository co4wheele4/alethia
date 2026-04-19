/**
 * ADR-035: Draft claims created via `createClaim` are scoped to the creator and listable
 * before evidence exists (ADR-018: non-authoritative until evidence-linked).
 */
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('createClaim workspace visibility (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('createClaim then claims query returns the draft for the same user', async () => {
    const text = `E2E_CREATE_CLAIM_${Date.now()}`;
    const mutation = `
      mutation CreateClaim($text: String!) {
        createClaim(text: $text) {
          id
          text
          status
          createdByUserId
        }
      }
    `;
    const created = await graphqlRequest<{
      createClaim?: {
        id: string;
        text: string;
        status: string;
        createdByUserId: string | null;
      };
    }>(context.app, mutation, { text }, { authToken: context.auth.userToken });

    expect(created.status).toBe(200);
    expect(created.body?.errors).toBeUndefined();
    const row = created.body?.data?.createClaim;
    expect(row?.text).toBe(text);
    expect(row?.status).toBe('DRAFT');
    expect(row?.createdByUserId).toBe(context.testData.user.id);
    expect(row?.id).toBeTruthy();

    const listQuery = `
      query Claims($limit: Int!, $offset: Int!) {
        claims(limit: $limit, offset: $offset, filter: { lifecycle: DRAFT }) {
          id
          text
        }
      }
    `;
    const listed = await graphqlRequest<{
      claims?: { id: string; text: string }[];
    }>(
      context.app,
      listQuery,
      { limit: 100, offset: 0 },
      { authToken: context.auth.userToken },
    );
    expect(listed.status).toBe(200);
    const ids = listed.body?.data?.claims?.map((c) => c.id) ?? [];
    expect(ids).toContain(row!.id);
  });
});
