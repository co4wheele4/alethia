/**
 * ADR-035: JWT-scoped workspace (document ownership) — another user's claims
 * and evidence must not appear in search/list/detail paths for a signed-in user.
 */
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { ClaimStatus, EvidenceSourceKind } from '@prisma/client';
import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';
import { evidenceContentSha256Hex } from '../../../src/common/utils/evidence-content-hash';

describe('Workspace isolation (ADR-035) (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('does not surface another user claim or evidence in search / evidenceById', async () => {
    const { prisma, auth } = context;
    const passwordHash = await bcrypt.hash('password', 12);
    const otherUser = await prisma.user.create({
      data: {
        email: `other-${randomUUID()}@example.com`,
        name: 'Other User',
        passwordHash,
      },
    });

    const otherDoc = await prisma.document.create({
      data: { title: 'Other doc', userId: otherUser.id },
    });
    const otherChunk = await prisma.documentChunk.create({
      data: {
        documentId: otherDoc.id,
        chunkIndex: 0,
        content: 'chunk for other user',
      },
    });

    const snippet = 'abcd';
    const evidenceId = randomUUID();
    const claimId = randomUUID();
    const secretSubstring = `ADR035_OTHER_USER_CLAIM_${randomUUID()}`;

    await prisma.evidence.create({
      data: {
        id: evidenceId,
        createdBy: otherUser.id,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: otherDoc.id,
        chunkId: otherChunk.id,
        startOffset: 0,
        endOffset: snippet.length,
        snippet,
        contentSha256: evidenceContentSha256Hex(snippet),
      },
    });

    await prisma.claim.create({
      data: {
        id: claimId,
        text: secretSubstring,
        status: ClaimStatus.DRAFT,
      },
    });

    await prisma.claimEvidenceLink.create({
      data: {
        claimId,
        evidenceId,
      },
    });

    const loginMutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password)
      }
    `;
    const ownerLogin = await graphqlRequest<{ login?: string }>(
      context.app,
      loginMutation,
      { email: otherUser.email, password: 'password' },
      { authToken: undefined },
    );
    const ownerToken = ownerLogin.body?.data?.login;
    if (!ownerToken) {
      throw new Error('expected login token for other user');
    }

    const searchQuery = `
      query Search($input: SearchClaimsInput!) {
        searchClaims(input: $input) {
          id
          text
        }
      }
    `;
    const input = {
      queryText: secretSubstring,
      matchMode: 'SUBSTRING',
      caseSensitive: true,
      orderBy: 'ID_ASC',
      limit: 20,
      offset: 0,
    };

    const searchAsPrimary = await graphqlRequest<{
      searchClaims?: { id: string; text: string }[];
    }>(context.app, searchQuery, { input }, { authToken: auth.userToken });

    expect(searchAsPrimary.status).toBe(200);
    expect(
      searchAsPrimary.body?.data?.searchClaims?.map((c) => c.id) ?? [],
    ).not.toContain(claimId);

    const evQuery = `
      query Ev($id: String!) {
        evidenceById(id: $id) {
          id
        }
      }
    `;
    const evAsPrimary = await graphqlRequest<{
      evidenceById?: { id: string } | null;
    }>(context.app, evQuery, { id: evidenceId }, { authToken: auth.userToken });
    expect(evAsPrimary.status).toBe(200);
    expect(evAsPrimary.body?.data?.evidenceById).toBeNull();

    const searchAsOwner = await graphqlRequest<{
      searchClaims?: { id: string; text: string }[];
    }>(context.app, searchQuery, { input }, { authToken: ownerToken });

    expect(searchAsOwner.body?.data?.searchClaims?.map((c) => c.id)).toContain(
      claimId,
    );

    const evAsOwner = await graphqlRequest<{
      evidenceById?: { id: string } | null;
    }>(context.app, evQuery, { id: evidenceId }, { authToken: ownerToken });
    expect(evAsOwner.body?.data?.evidenceById?.id).toBe(evidenceId);
  });
});
