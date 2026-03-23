import { graphqlRequest } from '../../helpers/graphql-request';
import {
  setupTestApp,
  teardownTestApp,
  type TestContext,
} from '../../helpers/test-setup';

describe('ReviewAssignmentResolver (ADR-016 reviewer responses)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  async function seedClaimVisibleToBothUsers() {
    const { prisma, testData } = context;

    // Seed an admin-owned document + chunk so admin has workspace visibility.
    const adminDoc = await prisma.document.create({
      data: { title: 'Admin Evidence Doc', userId: testData.admin.id },
      select: { id: true },
    });
    const adminChunk = await prisma.documentChunk.create({
      data: {
        documentId: adminDoc.id,
        chunkIndex: 0,
        content: 'Admin chunk content',
      },
      select: { id: true },
    });

    const claim = await prisma.claim.create({
      data: { text: 'A coordination-only claim for reviewer response tests.' },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewedBy: true,
        reviewerNote: true,
      },
    });

    // ADR-019 Evidence + ClaimEvidenceLink (requestReview requires evidence-closed claim).
    // User's document (testData.document + testData.chunk) for user workspace visibility.
    const userEvidence = await prisma.evidence.create({
      data: {
        sourceType: 'DOCUMENT',
        sourceDocumentId: testData.document.id,
        chunkId: testData.chunk.id,
        startOffset: 0,
        endOffset: 5,
        snippet: 'Test ',
        createdBy: testData.user.id,
      },
      select: { id: true },
    });
    await prisma.claimEvidenceLink.create({
      data: { evidenceId: userEvidence.id, claimId: claim.id },
    });

    // Admin's document for admin workspace visibility (assignReviewer).
    const adminEvidence = await prisma.evidence.create({
      data: {
        sourceType: 'DOCUMENT',
        sourceDocumentId: adminDoc.id,
        chunkId: adminChunk.id,
        startOffset: 0,
        endOffset: 5,
        snippet: 'Admin',
        createdBy: testData.admin.id,
      },
      select: { id: true },
    });
    await prisma.claimEvidenceLink.create({
      data: { evidenceId: adminEvidence.id, claimId: claim.id },
    });

    return { claimId: claim.id };
  }

  async function createReviewRequestAsUser(claimId: string) {
    const mutation = `
      mutation RequestReview($claimId: ID!, $source: ReviewRequestSource!, $note: String) {
        requestReview(claimId: $claimId, source: $source, note: $note) {
          id
          claimId
        }
      }
    `;

    const res = await graphqlRequest<{
      requestReview?: { id: string; claimId: string } | null;
    }>(
      context.app,
      mutation,
      {
        claimId,
        source: 'CLAIM_VIEW',
        note: 'Coordination-only review request',
      },
      { authToken: context.auth.userToken },
    );
    expect(res.status).toBe(200);
    expect(res.body?.errors ?? []).toHaveLength(0);
    const rrId = res.body?.data?.requestReview?.id;
    expect(typeof rrId).toBe('string');
    return rrId as string;
  }

  async function assignReviewerAsAdmin(
    reviewRequestId: string,
    reviewerUserId: string,
  ) {
    const mutation = `
      mutation AssignReviewer($reviewRequestId: ID!, $reviewerUserId: ID!) {
        assignReviewer(reviewRequestId: $reviewRequestId, reviewerUserId: $reviewerUserId) {
          id
          reviewRequestId
          reviewerUserId
        }
      }
    `;

    const res = await graphqlRequest<{
      assignReviewer?: { id: string } | null;
    }>(
      context.app,
      mutation,
      { reviewRequestId, reviewerUserId },
      { authToken: context.auth.adminToken },
    );
    expect(res.status).toBe(200);
    expect(res.body?.errors ?? []).toHaveLength(0);
    const raId = res.body?.data?.assignReviewer?.id;
    expect(typeof raId).toBe('string');
    return raId as string;
  }

  async function respondToAssignment(args: {
    reviewAssignmentId: string;
    response: 'ACKNOWLEDGED' | 'DECLINED';
    note?: string;
    authToken?: string;
  }) {
    const mutation = `
      mutation RespondToReviewAssignment($reviewAssignmentId: ID!, $response: ReviewerResponseType!, $note: String) {
        respondToReviewAssignment(reviewAssignmentId: $reviewAssignmentId, response: $response, note: $note) {
          id
          reviewAssignmentId
          reviewerUserId
          response
          respondedAt
          note
        }
      }
    `;

    return await graphqlRequest<{
      respondToReviewAssignment?: { id: string } | null;
    }>(
      context.app,
      mutation,
      {
        reviewAssignmentId: args.reviewAssignmentId,
        response: args.response,
        note: args.note ?? null,
      },
      // Explicitly pass authToken key so tests can send "no auth" by using an empty string.
      args.authToken !== undefined ? { authToken: args.authToken } : undefined,
    );
  }

  it('allows the assigned reviewer to ACKNOWLEDGE without mutating claim lifecycle', async () => {
    const { prisma } = context;

    const { claimId } = await seedClaimVisibleToBothUsers();
    const rrId = await createReviewRequestAsUser(claimId);
    const raId = await assignReviewerAsAdmin(rrId, context.testData.user.id);

    const before = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        status: true,
        reviewedAt: true,
        reviewedBy: true,
        reviewerNote: true,
      },
    });
    expect(before).toBeTruthy();

    const res = await respondToAssignment({
      reviewAssignmentId: raId,
      response: 'ACKNOWLEDGED',
      note: 'Seen (coordination only).',
      authToken: context.auth.userToken,
    });

    expect(res.status).toBe(200);
    expect(res.body?.errors ?? []).toHaveLength(0);
    expect(res.body?.data?.respondToReviewAssignment?.id).toBeTruthy();

    const after = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        status: true,
        reviewedAt: true,
        reviewedBy: true,
        reviewerNote: true,
      },
    });
    expect(after).toEqual(before);
  });

  it('rejects duplicate responses with DUPLICATE_RESPONSE', async () => {
    const { claimId } = await seedClaimVisibleToBothUsers();
    const rrId = await createReviewRequestAsUser(claimId);
    const raId = await assignReviewerAsAdmin(rrId, context.testData.user.id);

    const first = await respondToAssignment({
      reviewAssignmentId: raId,
      response: 'ACKNOWLEDGED',
      authToken: context.auth.userToken,
    });
    expect(first.status).toBe(200);
    expect(first.body?.errors ?? []).toHaveLength(0);

    const second = await respondToAssignment({
      reviewAssignmentId: raId,
      response: 'DECLINED',
      authToken: context.auth.userToken,
    });
    expect(second.status).toBe(200);
    expect(second.body?.errors).toBeDefined();
    expect(second.body?.errors?.[0]?.extensions?.code).toBe(
      'DUPLICATE_RESPONSE',
    );
  });

  it('returns UNAUTHORIZED when not authenticated', async () => {
    const res = await respondToAssignment({
      reviewAssignmentId: 'ra-missing',
      response: 'ACKNOWLEDGED',
      authToken: '',
    });
    expect(res.status).toBe(200);
    expect(res.body?.errors).toBeDefined();
    expect(res.body?.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED');
  });

  it('returns ASSIGNMENT_NOT_FOUND when assignment does not exist', async () => {
    const res = await respondToAssignment({
      reviewAssignmentId: 'ra-missing',
      response: 'ACKNOWLEDGED',
      authToken: context.auth.userToken,
    });
    expect(res.status).toBe(200);
    expect(res.body?.errors).toBeDefined();
    expect(res.body?.errors?.[0]?.extensions?.code).toBe(
      'ASSIGNMENT_NOT_FOUND',
    );
  });

  it('returns NOT_ASSIGNED_REVIEWER when authenticated user is not the assignment reviewer', async () => {
    const { claimId } = await seedClaimVisibleToBothUsers();
    const rrId = await createReviewRequestAsUser(claimId);
    const raId = await assignReviewerAsAdmin(rrId, context.testData.user.id);

    const res = await respondToAssignment({
      reviewAssignmentId: raId,
      response: 'ACKNOWLEDGED',
      authToken: context.auth.adminToken,
    });
    expect(res.status).toBe(200);
    expect(res.body?.errors).toBeDefined();
    expect(res.body?.errors?.[0]?.extensions?.code).toBe(
      'NOT_ASSIGNED_REVIEWER',
    );
  });
});
