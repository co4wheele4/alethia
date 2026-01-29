import { PrismaService } from '@prisma/prisma.service';
import { ReviewAssignmentResolver } from './review-assignment.resolver';

describe('ReviewAssignmentResolver', () => {
  let resolver: ReviewAssignmentResolver;
  let prisma: PrismaService;

  let reviewRequestFindFirst: jest.Mock;
  let reviewRequestFindUnique: jest.Mock;
  let claimFindFirst: jest.Mock;
  let reviewAssignmentCreate: jest.Mock;

  beforeEach(() => {
    reviewRequestFindFirst = jest.fn();
    reviewRequestFindUnique = jest.fn();
    claimFindFirst = jest.fn();
    reviewAssignmentCreate = jest.fn();

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
      },
    } as unknown as PrismaService;

    resolver = new ReviewAssignmentResolver(prisma);
  });

  it('assignReviewer rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.assignReviewer('rr1', 'u2', { req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHORIZED' },
    });
  });

  it('assignReviewer rejects non-admin role with UNAUTHORIZED', async () => {
    await expect(
      resolver.assignReviewer('rr1', 'u2', {
        req: { user: { sub: 'u1', role: 'USER' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHORIZED' },
    });
  });

  it('assignReviewer returns REVIEW_REQUEST_NOT_FOUND when review request is missing or not visible', async () => {
    reviewRequestFindFirst.mockResolvedValue(null);
    await expect(
      resolver.assignReviewer('missing', 'u2', {
        req: { user: { sub: 'admin1', role: 'ADMIN' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: 'REVIEW_REQUEST_NOT_FOUND' },
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
      extensions: { code: 'REVIEWER_NOT_ELIGIBLE' },
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
    } as any);

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
      extensions: { code: 'DUPLICATE_ASSIGNMENT' },
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
      extensions: { code: 'REVIEW_REQUEST_NOT_FOUND' },
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
      extensions: { code: 'REVIEWER_NOT_ELIGIBLE' },
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
});
