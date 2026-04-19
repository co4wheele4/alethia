import { PrismaService } from '@prisma/prisma.service';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { ReviewRequestResolver } from './review-request.resolver';
import { ReviewRequestSource } from '@models/review-request.model';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('ReviewRequestResolver', () => {
  let resolver: ReviewRequestResolver;
  let prisma: PrismaService;
  let dataLoaders: jest.Mocked<DataLoaderService>;

  let claimFindFirst: jest.Mock;
  let claimEvidenceFindFirst: jest.Mock;
  let claimEvidenceLinkCount: jest.Mock;
  let reviewRequestFindMany: jest.Mock;
  let reviewRequestCreate: jest.Mock;
  let reviewAssignmentFindMany: jest.Mock;
  let userLoad: jest.Mock;

  beforeEach(() => {
    claimFindFirst = jest.fn();
    claimEvidenceFindFirst = jest.fn();
    claimEvidenceLinkCount = jest.fn();
    reviewRequestFindMany = jest.fn();
    reviewRequestCreate = jest.fn();
    reviewAssignmentFindMany = jest.fn();
    userLoad = jest.fn();

    prisma = {
      claim: { findFirst: claimFindFirst },
      claimEvidence: { findFirst: claimEvidenceFindFirst },
      claimEvidenceLink: { count: claimEvidenceLinkCount },
      reviewRequest: {
        findMany: reviewRequestFindMany,
        create: reviewRequestCreate,
      },
      reviewAssignment: {
        findMany: reviewAssignmentFindMany,
      },
    } as unknown as PrismaService;

    dataLoaders = {
      getUserLoader: jest.fn().mockReturnValue({ load: userLoad }),
    } as unknown as jest.Mocked<DataLoaderService>;

    resolver = new ReviewRequestResolver(prisma, dataLoaders);
  });

  it('myReviewRequests rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.myReviewRequests({ req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('myReviewRequests queries by requestedByUserId', async () => {
    reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }] as any);
    const result = await resolver.myReviewRequests({
      req: { user: { sub: 'u1' } },
    } as any);
    expect(result).toEqual([{ id: 'rr1' }]);
    expect(reviewRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requestedByUserId: 'u1' },
      }),
    );
  });

  it('reviewQueue rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.reviewQueue({ req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('reviewQueue scopes to claims visible via evidence -> document.userId', async () => {
    reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }] as any);
    const result = await resolver.reviewQueue({
      req: { user: { sub: 'u1' } },
    } as any);
    expect(result).toEqual([{ id: 'rr1' }]);
    expect(reviewRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          claim: {
            OR: [
              { createdByUserId: 'u1' },
              {
                evidenceLinks: {
                  some: {
                    evidence: { sourceDocument: { userId: 'u1' } },
                  },
                },
              },
              {
                evidence: {
                  some: { document: { userId: 'u1' } },
                },
              },
            ],
          },
        },
      }),
    );
  });

  it('reviewRequestsByClaim rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.reviewRequestsByClaim('c1', { req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('reviewRequestsByClaim returns CLAIM_NOT_FOUND when claim is missing (or not visible)', async () => {
    claimFindFirst.mockResolvedValue(null);
    await expect(
      resolver.reviewRequestsByClaim('missing', {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
    });
  });

  it('reviewRequestsByClaim queries by claimId after workspace-scoped existence check', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }] as any);

    const result = await resolver.reviewRequestsByClaim('c1', {
      req: { user: { sub: 'u1' } },
    } as any);

    expect(result).toEqual([{ id: 'rr1' }]);
    expect(claimFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'c1',
          OR: [
            { createdByUserId: 'u1' },
            {
              evidenceLinks: {
                some: {
                  evidence: { sourceDocument: { userId: 'u1' } },
                },
              },
            },
            { evidence: { some: { document: { userId: 'u1' } } } },
          ],
        },
        select: { id: true },
      }),
    );
    expect(claimEvidenceLinkCount).toHaveBeenCalled();
    expect(reviewRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { claimId: 'c1' },
        orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('reviewRequestsByClaim rejects non-evidence-closed claims with CLAIM_NOT_EVIDENCE_CLOSED', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(0);
    claimEvidenceFindFirst.mockResolvedValue(null);

    await expect(
      resolver.reviewRequestsByClaim('c1', {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_EVIDENCE_CLOSED },
    });
  });

  it('requestReview rejects unauthenticated access with UNAUTHORIZED', async () => {
    await expect(
      resolver.requestReview('c1', ReviewRequestSource.CLAIM_VIEW, undefined, {
        req: { user: {} },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('requestReview returns CLAIM_NOT_FOUND when claim is missing (or not visible)', async () => {
    claimFindFirst.mockResolvedValue(null);
    await expect(
      resolver.requestReview(
        'missing',
        ReviewRequestSource.CLAIM_VIEW,
        undefined,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
    });
  });

  it('requestReview creates a review request and preserves note nullability', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    reviewRequestCreate.mockResolvedValue({ id: 'rr1', claimId: 'c1' } as any);

    const result = await resolver.requestReview(
      'c1',
      ReviewRequestSource.CLAIM_VIEW,
      undefined,
      { req: { user: { sub: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'rr1', claimId: 'c1' });
    expect(reviewRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          claimId: 'c1',
          requestedByUserId: 'u1',
          source: ReviewRequestSource.CLAIM_VIEW,
          note: null,
        }),
      }),
    );
  });

  it('requestReview rejects duplicates with DUPLICATE_REVIEW_REQUEST', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    reviewRequestCreate.mockRejectedValue({ code: 'P2002' });

    await expect(
      resolver.requestReview('c1', ReviewRequestSource.CLAIM_VIEW, undefined, {
        req: { user: { id: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.DUPLICATE_REVIEW_REQUEST },
    });
  });

  it('requestReview maps FK race (P2003) to CLAIM_NOT_FOUND', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    reviewRequestCreate.mockRejectedValue({ code: 'P2003' });

    await expect(
      resolver.requestReview('c1', ReviewRequestSource.CLAIM_VIEW, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
    });
  });

  it('requestReview rethrows unknown errors', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    const err = new Error('boom');
    reviewRequestCreate.mockRejectedValue(err);

    await expect(
      resolver.requestReview('c1', ReviewRequestSource.CLAIM_VIEW, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toBe(err);
  });

  it('requestReview rejects non-evidence-closed claims with CLAIM_NOT_EVIDENCE_CLOSED', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkCount.mockResolvedValue(0);
    claimEvidenceFindFirst.mockResolvedValue(null);

    await expect(
      resolver.requestReview('c1', ReviewRequestSource.CLAIM_VIEW, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_EVIDENCE_CLOSED },
    });
  });

  it('requestedBy resolves via DataLoader', async () => {
    userLoad.mockResolvedValue({ id: 'u1', email: 'u1@example.com' } as any);
    const result = await resolver.requestedBy({
      id: 'rr1',
      requestedByUserId: 'u1',
    } as any);
    expect(result).toMatchObject({ id: 'u1' });
    expect(dataLoaders.getUserLoader).toHaveBeenCalled();
    expect(userLoad).toHaveBeenCalledWith('u1');
  });

  it('requestedBy fails invariant when referenced user is missing', async () => {
    userLoad.mockResolvedValue(null);
    await expect(
      resolver.requestedBy({ id: 'rr1', requestedByUserId: 'missing' } as any),
    ).rejects.toThrow(/ReviewRequest\(rr1\).*missing User\(missing\)/i);
  });

  it('reviewAssignments returns assignments ordered by assignedAt desc then id desc', async () => {
    reviewAssignmentFindMany.mockResolvedValue([{ id: 'ra1' }] as any);
    const result = await resolver.reviewAssignments({ id: 'rr1' } as any);
    expect(result).toEqual([{ id: 'ra1' }]);
    expect(reviewAssignmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reviewRequestId: 'rr1' },
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });
});
