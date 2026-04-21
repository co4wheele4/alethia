import { PrismaService } from '@prisma/prisma.service';
import { ReviewAssignmentResolver } from './review-assignment.resolver';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { ReviewerResponseType } from '@models/reviewer-response.model';

describe('ReviewAssignmentResolver', () => {
  let resolver: ReviewAssignmentResolver;
  let prisma: PrismaService;

  let reviewRequestFindFirst: jest.Mock;
  let reviewRequestFindUnique: jest.Mock;
  let claimFindFirst: jest.Mock;
  let reviewAssignmentCreate: jest.Mock;
  let reviewAssignmentFindUnique: jest.Mock;
  let reviewerResponseFindUnique: jest.Mock;
  let reviewerResponseCreate: jest.Mock;

  beforeEach(() => {
    reviewRequestFindFirst = jest.fn();
    reviewRequestFindUnique = jest.fn();
    claimFindFirst = jest.fn();
    reviewAssignmentCreate = jest.fn();
    reviewAssignmentFindUnique = jest.fn();
    reviewerResponseFindUnique = jest.fn();
    reviewerResponseCreate = jest.fn();

    prisma = {
      reviewRequest: {
        findFirst: reviewRequestFindFirst,
        findUnique: reviewRequestFindUnique,
      },
      claim: {
        findFirst: claimFindFirst,
      },
      reviewAssignment: {
        create: reviewAssignmentCreate,
        findUnique: reviewAssignmentFindUnique,
      },
      reviewerResponse: {
        findUnique: reviewerResponseFindUnique,
        create: reviewerResponseCreate,
      },
    } as unknown as PrismaService;

    resolver = new ReviewAssignmentResolver(prisma);
  });

  it('assignReviewer rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.assignReviewer('rr1', 'u2', { req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('assignReviewer rejects non-admin role with UNAUTHORIZED', async () => {
    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'u1', role: 'USER' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('assignReviewer returns REVIEW_REQUEST_NOT_FOUND when review request is missing or not visible', async () => {
    reviewRequestFindFirst.mockResolvedValue(null);
    await expect(
      resolver.assignReviewer('missing', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.REVIEW_REQUEST_NOT_FOUND },
    });
  });

  it('assignReviewer returns REVIEWER_NOT_ELIGIBLE when reviewer lacks workspace visibility', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue(null);

    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.REVIEWER_NOT_ELIGIBLE },
    });
  });

  it('assignReviewer creates a ReviewAssignment without mutating Claim or ReviewRequest', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewAssignmentCreate.mockResolvedValue({
      id: 'ra1',
      reviewRequestId: 'rr1',
      reviewerUserId: 'u2',
      assignedByUserId: 'admin1',
    } as any);

    const result = await resolver.assignReviewer('rr1', 'u2', {
      req: { user: { sub: 'admin1', role: 'ADMIN' } },
    });

    expect(result).toMatchObject({ id: 'ra1' });
    expect(reviewAssignmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reviewRequestId: 'rr1',
          reviewerUserId: 'u2',
          assignedByUserId: 'admin1',
        },
      }),
    );
  });

  it('assignReviewer rejects duplicates with DUPLICATE_ASSIGNMENT', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewAssignmentCreate.mockRejectedValue({ code: 'P2002' });

    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.DUPLICATE_ASSIGNMENT },
    });
  });

  it('assignReviewer maps FK race (P2003) to REVIEW_REQUEST_NOT_FOUND when review request is deleted', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewAssignmentCreate.mockRejectedValue({ code: 'P2003' });
    reviewRequestFindUnique.mockResolvedValue(null);

    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.REVIEW_REQUEST_NOT_FOUND },
    });
  });

  it('assignReviewer maps FK race (P2003) to REVIEWER_NOT_ELIGIBLE when review request still exists', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewAssignmentCreate.mockRejectedValue({ code: 'P2003' });
    reviewRequestFindUnique.mockResolvedValue({ id: 'rr1' });

    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.REVIEWER_NOT_ELIGIBLE },
    });
  });

  it('assignReviewer rethrows unknown errors', async () => {
    reviewRequestFindFirst.mockResolvedValue({ id: 'rr1', claimId: 'c1' });
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    const err = new Error('boom');
    reviewAssignmentCreate.mockRejectedValue(err);

    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toBe(err);
  });

  it('reviewerResponse resolves via compound key (reviewAssignmentId, reviewerUserId)', async () => {
    reviewerResponseFindUnique.mockResolvedValue({ id: 'resp1' } as any);
    const result = await resolver.reviewerResponse({
      id: 'ra1',
      reviewerUserId: 'u1',
    } as any);
    expect(result).toEqual({ id: 'resp1' });
    expect(reviewerResponseFindUnique).toHaveBeenCalledWith({
      where: {
        reviewAssignmentId_reviewerUserId: {
          reviewAssignmentId: 'ra1',
          reviewerUserId: 'u1',
        },
      },
    });
  });

  it('respondToReviewAssignment rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: {} } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('respondToReviewAssignment returns ASSIGNMENT_NOT_FOUND when assignment is missing', async () => {
    reviewAssignmentFindUnique.mockResolvedValue(null);
    await expect(
      resolver.respondToReviewAssignment(
        'missing',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.ASSIGNMENT_NOT_FOUND },
    });
  });

  it('respondToReviewAssignment rejects NOT_ASSIGNED_REVIEWER when user is not the assignee', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'other',
    });
    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { id: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.NOT_ASSIGNED_REVIEWER },
    });
  });

  it('respondToReviewAssignment creates a response and preserves note nullability', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'u1',
    });
    reviewerResponseCreate.mockResolvedValue({ id: 'resp1' } as any);

    const result = await resolver.respondToReviewAssignment(
      'ra1',
      ReviewerResponseType.DECLINED,
      undefined,
      { req: { user: { sub: 'u1' } } },
    );

    expect(result).toEqual({ id: 'resp1' });
    expect(reviewerResponseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reviewAssignmentId: 'ra1',
          reviewerUserId: 'u1',
          response: ReviewerResponseType.DECLINED,
          note: null,
        },
      }),
    );
  });

  it('respondToReviewAssignment rejects duplicates with DUPLICATE_RESPONSE', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'u1',
    });
    reviewerResponseCreate.mockRejectedValue({ code: 'P2002' });

    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.DUPLICATE_RESPONSE },
    });
  });

  it('respondToReviewAssignment rethrows unknown errors', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'u1',
    });
    const err = new Error('boom');
    reviewerResponseCreate.mockRejectedValue(err);

    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toBe(err);
  });

  it('respondToReviewAssignment maps FK race (P2003) to ASSIGNMENT_NOT_FOUND when assignment is deleted', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'u1',
    });
    reviewerResponseCreate.mockRejectedValue({ code: 'P2003' });
    // Re-check shows assignment no longer exists.
    reviewAssignmentFindUnique
      .mockResolvedValueOnce({
        id: 'ra1',
        reviewerUserId: 'u1',
      })
      .mockResolvedValueOnce(null);

    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.ASSIGNMENT_NOT_FOUND },
    });
  });

  it('respondToReviewAssignment maps FK race (P2003) to UNAUTHORIZED when assignment still exists', async () => {
    reviewAssignmentFindUnique.mockResolvedValue({
      id: 'ra1',
      reviewerUserId: 'u1',
    });
    reviewerResponseCreate.mockRejectedValue({ code: 'P2003' });
    // Re-check shows assignment still exists; contract maps to UNAUTHORIZED.
    reviewAssignmentFindUnique
      .mockResolvedValueOnce({
        id: 'ra1',
        reviewerUserId: 'u1',
      })
      .mockResolvedValueOnce({
        id: 'ra1',
        reviewerUserId: 'u1',
      });

    await expect(
      resolver.respondToReviewAssignment(
        'ra1',
        ReviewerResponseType.ACKNOWLEDGED,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });
});
