import { ClaimLifecycleState } from '@models/claim.model';
import { PrismaService } from '@prisma/prisma.service';
import { ClaimAdjudicationService } from './claim-adjudication.service';

describe('ClaimAdjudicationService', () => {
  it('writes adjudication log then updates claim in one transaction', async () => {
    const adjudicationLogCreate = jest.fn().mockResolvedValue({});
    const adjudicationLogFindFirst = jest.fn().mockResolvedValue(null);
    const claimUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'c1', status: 'REVIEWED' });
    const tx = {
      adjudicationLog: {
        create: adjudicationLogCreate,
        findFirst: adjudicationLogFindFirst,
      },
      claim: { update: claimUpdate },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    } as unknown as PrismaService;

    const service = new ClaimAdjudicationService(prisma);
    const out = await service.applyAdjudication({
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: ClaimLifecycleState.REVIEW,
      reviewerNote: 'note',
      previousStatus: 'DRAFT',
      nextStatus: 'REVIEWED',
    });

    expect(out).toEqual({ id: 'c1', status: 'REVIEWED' });
    expect(adjudicationLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'REVIEW',
        previousStatus: 'DRAFT',
        newStatus: 'REVIEWED',
        reviewerNote: 'note',
        prevHash: null,
        entryHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(claimUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({
          status: 'REVIEWED',
          reviewedBy: 'u1',
          reviewerNote: 'note',
        }),
      }),
    );
  });

  it('uses previous adjudication log entry hash when present', async () => {
    const adjudicationLogCreate = jest.fn().mockResolvedValue({});
    const adjudicationLogFindFirst = jest
      .fn()
      .mockResolvedValue({ entryHash: 'aa'.repeat(32) });
    const claimUpdate = jest
      .fn()
      .mockResolvedValue({ id: 'c2', status: 'REVIEWED' });
    const tx = {
      adjudicationLog: {
        create: adjudicationLogCreate,
        findFirst: adjudicationLogFindFirst,
      },
      claim: { update: claimUpdate },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    } as unknown as PrismaService;

    const service = new ClaimAdjudicationService(prisma);
    await service.applyAdjudication({
      claimId: 'c2',
      adjudicatorId: 'u1',
      decision: ClaimLifecycleState.REVIEW,
      reviewerNote: null,
      previousStatus: 'DRAFT',
      nextStatus: 'REVIEWED',
    });

    expect(adjudicationLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        prevHash: 'aa'.repeat(32),
        entryHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });
});
