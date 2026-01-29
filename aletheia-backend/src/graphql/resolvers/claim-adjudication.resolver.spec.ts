import { PrismaService } from '@prisma/prisma.service';
import { ClaimAdjudicationResolver } from './claim-adjudication.resolver';
import { ClaimLifecycleState, ClaimStatus } from '@models/claim.model';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('ClaimAdjudicationResolver', () => {
  let resolver: ClaimAdjudicationResolver;
  let prisma: PrismaService;
  let claimFindFirst: jest.Mock;
  let claimUpdate: jest.Mock;

  beforeEach(() => {
    claimFindFirst = jest.fn();
    claimUpdate = jest.fn();

    prisma = {
      claim: {
        findFirst: claimFindFirst,
        update: claimUpdate,
      },
    } as unknown as PrismaService;

    resolver = new ClaimAdjudicationResolver(prisma);
  });

  it('rejects unauthenticated access with UNAUTHORIZED_REVIEWER', async () => {
    await expect(
      resolver.adjudicateClaim('c1', ClaimLifecycleState.REVIEW, undefined, {
        req: { user: {} },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED_REVIEWER },
    });
  });

  it('returns CLAIM_NOT_FOUND when claim is missing (or not visible)', async () => {
    claimFindFirst.mockResolvedValue(null);

    await expect(
      resolver.adjudicateClaim(
        'missing',
        ClaimLifecycleState.REVIEW,
        undefined,
        {
          req: { user: { sub: 'u1' } },
        } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
    });
  });

  it('allows DRAFT -> REVIEW and persists adjudication metadata', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1', status: ClaimStatus.DRAFT });
    claimUpdate.mockResolvedValue({ id: 'c1', status: ClaimStatus.REVIEWED });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.REVIEW,
      undefined,
      { req: { user: { sub: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.REVIEWED });
    expect(claimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({
          status: ClaimStatus.REVIEWED,
          reviewedAt: expect.any(Date),
          reviewedBy: 'u1',
          reviewerNote: null,
        }),
      }),
    );
  });

  it('allows REVIEW -> ACCEPTED', async () => {
    claimFindFirst.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.REVIEWED,
    });
    claimUpdate.mockResolvedValue({ id: 'c1', status: ClaimStatus.ACCEPTED });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.ACCEPTED,
      'ok',
      { req: { user: { id: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.ACCEPTED });
    expect(claimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ClaimStatus.ACCEPTED,
          reviewedBy: 'u1',
          reviewerNote: 'ok',
        }),
      }),
    );
  });

  it('allows REVIEW -> REJECTED', async () => {
    claimFindFirst.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.REVIEWED,
    });
    claimUpdate.mockResolvedValue({ id: 'c1', status: ClaimStatus.REJECTED });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.REJECTED,
      'bad evidence',
      { req: { user: { sub: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.REJECTED });
    expect(claimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ClaimStatus.REJECTED,
          reviewerNote: 'bad evidence',
        }),
      }),
    );
  });

  it('rejects invalid transitions with INVALID_LIFECYCLE_TRANSITION', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1', status: ClaimStatus.DRAFT });

    await expect(
      resolver.adjudicateClaim('c1', ClaimLifecycleState.ACCEPTED, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION },
    });
  });

  it('rejects terminal-state transitions with INVALID_LIFECYCLE_TRANSITION', async () => {
    claimFindFirst.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.ACCEPTED,
    });

    await expect(
      resolver.adjudicateClaim('c1', ClaimLifecycleState.REJECTED, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION },
    });
  });
});
