import { PrismaService } from '@prisma/prisma.service';
import { ClaimAdjudicationResolver } from './claim-adjudication.resolver';
import { ClaimAdjudicationService } from './claim-adjudication.service';
import { ClaimLifecycleState, ClaimStatus } from '@models/claim.model';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('ClaimAdjudicationResolver', () => {
  let resolver: ClaimAdjudicationResolver;
  let prisma: PrismaService;
  let adjudication: ClaimAdjudicationService;
  let claimFindFirst: jest.Mock;
  let claimEvidenceFindFirst: jest.Mock;
  let claimEvidenceLinkCount: jest.Mock;
  let applyAdjudication: jest.Mock;

  beforeEach(() => {
    claimFindFirst = jest.fn();
    claimEvidenceFindFirst = jest.fn();
    claimEvidenceLinkCount = jest.fn();
    applyAdjudication = jest.fn();

    prisma = {
      claim: {
        findFirst: claimFindFirst,
      },
      claimEvidence: {
        findFirst: claimEvidenceFindFirst,
      },
      claimEvidenceLink: { count: claimEvidenceLinkCount },
    } as unknown as PrismaService;

    adjudication = { applyAdjudication } as unknown as ClaimAdjudicationService;

    resolver = new ClaimAdjudicationResolver(prisma, adjudication);
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
    claimFindFirst.mockResolvedValue({ id: 'c1', status: 'DRAFT' });
    claimEvidenceLinkCount.mockResolvedValue(1);
    applyAdjudication.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.REVIEWED,
    });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.REVIEW,
      undefined,
      { req: { user: { sub: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.REVIEWED });
    expect(applyAdjudication).toHaveBeenCalledWith(
      expect.objectContaining({
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: ClaimLifecycleState.REVIEW,
        reviewerNote: null,
        previousStatus: 'DRAFT',
        nextStatus: ClaimStatus.REVIEWED,
      }),
    );
  });

  it('allows REVIEW -> ACCEPTED', async () => {
    claimFindFirst.mockResolvedValue({
      id: 'c1',
      status: 'REVIEWED',
    });
    claimEvidenceLinkCount.mockResolvedValue(1);
    applyAdjudication.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.ACCEPTED,
    });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.ACCEPTED,
      'ok',
      { req: { user: { id: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.ACCEPTED });
    expect(applyAdjudication).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStatus: ClaimStatus.ACCEPTED,
        adjudicatorId: 'u1',
        reviewerNote: 'ok',
      }),
    );
  });

  it('allows REVIEW -> REJECTED', async () => {
    claimFindFirst.mockResolvedValue({
      id: 'c1',
      status: 'REVIEWED',
    });
    claimEvidenceLinkCount.mockResolvedValue(1);
    applyAdjudication.mockResolvedValue({
      id: 'c1',
      status: ClaimStatus.REJECTED,
    });

    const result = await resolver.adjudicateClaim(
      'c1',
      ClaimLifecycleState.REJECTED,
      'bad evidence',
      { req: { user: { sub: 'u1' } } } as any,
    );

    expect(result).toEqual({ id: 'c1', status: ClaimStatus.REJECTED });
    expect(applyAdjudication).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStatus: ClaimStatus.REJECTED,
        reviewerNote: 'bad evidence',
      }),
    );
  });

  it('rejects invalid transitions with INVALID_LIFECYCLE_TRANSITION', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1', status: ClaimStatus.DRAFT });
    claimEvidenceLinkCount.mockResolvedValue(1);

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
    claimEvidenceLinkCount.mockResolvedValue(1);

    await expect(
      resolver.adjudicateClaim('c1', ClaimLifecycleState.REJECTED, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION },
    });
  });

  it('rejects claims without adjudication-grade evidence with EVIDENCE_REQUIRED_FOR_ADJUDICATION', async () => {
    claimFindFirst.mockResolvedValue({ id: 'c1', status: ClaimStatus.DRAFT });
    claimEvidenceLinkCount.mockResolvedValue(0);
    claimEvidenceFindFirst.mockResolvedValue(null);

    await expect(
      resolver.adjudicateClaim('c1', ClaimLifecycleState.REVIEW, undefined, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_REQUIRED_FOR_ADJUDICATION },
    });
  });
});
