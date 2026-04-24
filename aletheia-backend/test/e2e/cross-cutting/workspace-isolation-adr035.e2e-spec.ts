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

  async function seedOtherUserWorkspace(seedLabel: string) {
    const { prisma } = context;
    const passwordHash = await bcrypt.hash('password', 12);
    const otherUser = await prisma.user.create({
      data: {
        email: `${seedLabel}-${randomUUID()}@example.com`,
        name: 'Other User',
        passwordHash,
      },
    });

    const otherDoc = await prisma.document.create({
      data: {
        title: `${seedLabel} Other doc`,
        userId: otherUser.id,
      },
    });
    const otherChunk = await prisma.documentChunk.create({
      data: {
        documentId: otherDoc.id,
        chunkIndex: 0,
        content: `${seedLabel} chunk for other user`,
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

    return { otherChunk, otherDoc, otherUser, ownerToken };
  }

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('does not surface another user claim or evidence in search / evidenceById', async () => {
    const { prisma, auth } = context;
    const { otherChunk, otherDoc, otherUser, ownerToken } =
      await seedOtherUserWorkspace('ADR035_SEARCH');

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

  it('filters document/chunk queries and blocks cross-user document/chunk mutations at the GraphQL boundary', async () => {
    const { app, auth, prisma } = context;
    const { otherChunk, otherDoc, ownerToken } =
      await seedOtherUserWorkspace('ADR035_DOCS');

    const docsQuery = `
      query Docs($limit: Int!, $offset: Int!) {
        documents(limit: $limit, offset: $offset) {
          id
          title
        }
      }
    `;
    const docQuery = `
      query Doc($id: String!) {
        document(id: $id) {
          id
          title
        }
      }
    `;
    const allChunksQuery = `
      query AllChunks {
        documentChunks {
          id
          documentId
          chunkIndex
        }
      }
    `;
    const chunkQuery = `
      query Chunk($id: String!) {
        documentChunk(id: $id) {
          id
          documentId
          chunkIndex
        }
      }
    `;
    const chunksByDocumentQuery = `
      query ChunksByDocument($documentId: String!) {
        chunksByDocument(documentId: $documentId) {
          id
          documentId
          chunkIndex
        }
      }
    `;
    const chunk0Query = `
      query Chunk0($documentId: String!) {
        chunk0ByDocument(documentId: $documentId) {
          id
          documentId
          chunkIndex
        }
      }
    `;
    const updateDocumentMutation = `
      mutation UpdateDocument($id: String!, $title: String) {
        updateDocument(id: $id, title: $title) {
          id
          title
        }
      }
    `;
    const createChunkMutation = `
      mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
        createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
          id
          chunkIndex
          content
        }
      }
    `;
    const updateChunkMutation = `
      mutation UpdateChunk($id: String!, $content: String) {
        updateChunk(id: $id, content: $content) {
          id
          content
        }
      }
    `;
    const deleteChunkMutation = `
      mutation DeleteChunk($id: String!) {
        deleteChunk(id: $id) {
          id
        }
      }
    `;

    const docsAsPrimary = await graphqlRequest<{
      documents?: Array<{ id: string }>;
    }>(
      app,
      docsQuery,
      { limit: 100, offset: 0 },
      { authToken: auth.userToken },
    );
    expect(docsAsPrimary.status).toBe(200);
    expect(docsAsPrimary.body?.errors).toBeUndefined();
    expect(
      docsAsPrimary.body?.data?.documents?.map((d) => d.id) ?? [],
    ).not.toContain(otherDoc.id);

    const docsAsOwner = await graphqlRequest<{
      documents?: Array<{ id: string }>;
    }>(app, docsQuery, { limit: 100, offset: 0 }, { authToken: ownerToken });
    expect(docsAsOwner.status).toBe(200);
    expect(docsAsOwner.body?.data?.documents?.map((d) => d.id) ?? []).toContain(
      otherDoc.id,
    );

    const docAsPrimary = await graphqlRequest<{
      document?: { id: string } | null;
    }>(app, docQuery, { id: otherDoc.id }, { authToken: auth.userToken });
    expect(docAsPrimary.status).toBe(200);
    expect(docAsPrimary.body?.data?.document).toBeNull();

    const docAsOwner = await graphqlRequest<{
      document?: { id: string } | null;
    }>(app, docQuery, { id: otherDoc.id }, { authToken: ownerToken });
    expect(docAsOwner.status).toBe(200);
    expect(docAsOwner.body?.data?.document?.id).toBe(otherDoc.id);

    const updateDocAsPrimary = await graphqlRequest<{
      updateDocument?: { id: string; title: string } | null;
    }>(
      app,
      updateDocumentMutation,
      { id: otherDoc.id, title: 'tampered title' },
      { authToken: auth.userToken },
    );
    expect(updateDocAsPrimary.status).toBe(200);
    expect(updateDocAsPrimary.body?.errors?.[0]?.message).toContain(
      'Cannot update documents for another user',
    );
    const persistedDoc = await prisma.document.findUnique({
      where: { id: otherDoc.id },
      select: { title: true },
    });
    expect(persistedDoc?.title).toBe(otherDoc.title);

    const chunksAsPrimary = await graphqlRequest<{
      documentChunks?: Array<{ id: string }>;
    }>(app, allChunksQuery, undefined, { authToken: auth.userToken });
    expect(chunksAsPrimary.status).toBe(200);
    expect(
      chunksAsPrimary.body?.data?.documentChunks?.map((chunk) => chunk.id) ??
        [],
    ).not.toContain(otherChunk.id);

    const chunksAsOwner = await graphqlRequest<{
      documentChunks?: Array<{ id: string }>;
    }>(app, allChunksQuery, undefined, { authToken: ownerToken });
    expect(chunksAsOwner.status).toBe(200);
    expect(
      chunksAsOwner.body?.data?.documentChunks?.map((chunk) => chunk.id) ?? [],
    ).toContain(otherChunk.id);

    const chunkAsPrimary = await graphqlRequest<{
      documentChunk?: { id: string } | null;
    }>(app, chunkQuery, { id: otherChunk.id }, { authToken: auth.userToken });
    expect(chunkAsPrimary.status).toBe(200);
    expect(chunkAsPrimary.body?.data?.documentChunk).toBeNull();

    const chunkAsOwner = await graphqlRequest<{
      documentChunk?: { id: string } | null;
    }>(app, chunkQuery, { id: otherChunk.id }, { authToken: ownerToken });
    expect(chunkAsOwner.status).toBe(200);
    expect(chunkAsOwner.body?.data?.documentChunk?.id).toBe(otherChunk.id);

    const chunksByDocAsPrimary = await graphqlRequest<{
      chunksByDocument?: Array<{ id: string }>;
    }>(
      app,
      chunksByDocumentQuery,
      { documentId: otherDoc.id },
      { authToken: auth.userToken },
    );
    expect(chunksByDocAsPrimary.status).toBe(200);
    expect(chunksByDocAsPrimary.body?.data?.chunksByDocument).toEqual([]);

    const chunksByDocAsOwner = await graphqlRequest<{
      chunksByDocument?: Array<{ id: string }>;
    }>(
      app,
      chunksByDocumentQuery,
      { documentId: otherDoc.id },
      { authToken: ownerToken },
    );
    expect(chunksByDocAsOwner.status).toBe(200);
    expect(
      chunksByDocAsOwner.body?.data?.chunksByDocument?.map((chunk) => chunk.id),
    ).toContain(otherChunk.id);

    const chunk0AsPrimary = await graphqlRequest<{
      chunk0ByDocument?: { id: string } | null;
    }>(
      app,
      chunk0Query,
      { documentId: otherDoc.id },
      { authToken: auth.userToken },
    );
    expect(chunk0AsPrimary.status).toBe(200);
    expect(chunk0AsPrimary.body?.data?.chunk0ByDocument).toBeNull();

    const chunk0AsOwner = await graphqlRequest<{
      chunk0ByDocument?: { id: string } | null;
    }>(
      app,
      chunk0Query,
      { documentId: otherDoc.id },
      { authToken: ownerToken },
    );
    expect(chunk0AsOwner.status).toBe(200);
    expect(chunk0AsOwner.body?.data?.chunk0ByDocument?.id).toBe(otherChunk.id);

    const createChunkAsPrimary = await graphqlRequest<{
      createChunk?: { id: string } | null;
    }>(
      app,
      createChunkMutation,
      {
        chunkIndex: 1,
        content: 'tampered chunk',
        documentId: otherDoc.id,
      },
      { authToken: auth.userToken },
    );
    expect(createChunkAsPrimary.status).toBe(200);
    expect(createChunkAsPrimary.body?.errors?.[0]?.message).toContain(
      'Cannot access chunks for another user',
    );
    expect(
      await prisma.documentChunk.count({ where: { documentId: otherDoc.id } }),
    ).toBe(1);

    const updateChunkAsPrimary = await graphqlRequest<{
      updateChunk?: { id: string } | null;
    }>(
      app,
      updateChunkMutation,
      { id: otherChunk.id, content: 'tampered content' },
      { authToken: auth.userToken },
    );
    expect(updateChunkAsPrimary.status).toBe(200);
    expect(updateChunkAsPrimary.body?.errors?.[0]?.message).toContain(
      `Document chunk not found: ${otherChunk.id}`,
    );
    const persistedChunk = await prisma.documentChunk.findUnique({
      where: { id: otherChunk.id },
      select: { content: true },
    });
    expect(persistedChunk?.content).toBe(otherChunk.content);

    const deleteChunkAsPrimary = await graphqlRequest<{
      deleteChunk?: { id: string } | null;
    }>(
      app,
      deleteChunkMutation,
      { id: otherChunk.id },
      { authToken: auth.userToken },
    );
    expect(deleteChunkAsPrimary.status).toBe(200);
    expect(deleteChunkAsPrimary.body?.errors?.[0]?.message).toContain(
      `Document chunk not found: ${otherChunk.id}`,
    );
    expect(
      await prisma.documentChunk.findUnique({ where: { id: otherChunk.id } }),
    ).not.toBeNull();
  });
});
