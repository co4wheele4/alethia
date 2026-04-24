import { Test } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule, GraphQLSchemaHost } from '@nestjs/graphql';
import { printSchema } from 'graphql';
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
  let reviewRequestFindMany: jest.Mock;
  let reviewerResponseCount: jest.Mock;
  let applyAdjudication: jest.Mock;

  beforeEach(() => {
    claimFindFirst = jest.fn();
    claimEvidenceFindFirst = jest.fn();
    claimEvidenceLinkCount = jest.fn();
    reviewRequestFindMany = jest.fn();
    reviewerResponseCount = jest.fn();
    applyAdjudication = jest.fn();

    prisma = {
      claim: {
        findFirst: claimFindFirst,
      },
      claimEvidence: {
        findFirst: claimEvidenceFindFirst,
      },
      claimEvidenceLink: { count: claimEvidenceLinkCount },
      reviewRequest: { findMany: reviewRequestFindMany },
      reviewerResponse: { count: reviewerResponseCount },
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

  it('reviewQuorumStatus rejects unauthenticated access', async () => {
    await expect(
      resolver.reviewQuorumStatus('c1', { req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED_REVIEWER },
    });
  });

  it('reviewQuorumStatus returns CLAIM_NOT_FOUND', async () => {
    claimFindFirst.mockResolvedValue(null);
    await expect(
      resolver.reviewQuorumStatus('c1', {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
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
      { req: { user: { sub: 'u1' } } },
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
      { req: { user: { id: 'u1' } } },
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
      { req: { user: { sub: 'u1' } } },
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

  it('reviewQuorumStatus uses default quorum count when env invalid', async () => {
    const prevE = process.env.REVIEW_QUORUM_ENABLED;
    const prevC = process.env.REVIEW_QUORUM_COUNT;
    process.env.REVIEW_QUORUM_ENABLED = 'true';
    process.env.REVIEW_QUORUM_COUNT = 'not-a-number';
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewRequestFindMany.mockResolvedValue([]);
    reviewerResponseCount.mockResolvedValue(0);

    const q = await resolver.reviewQuorumStatus('c1', {
      req: { user: { sub: 'u1' } },
    });

    expect(q.requiredCount).toBe(2);
    process.env.REVIEW_QUORUM_ENABLED = prevE;
    process.env.REVIEW_QUORUM_COUNT = prevC;
  });

  it('reviewQuorumStatus returns counts', async () => {
    const prevE = process.env.REVIEW_QUORUM_ENABLED;
    const prevC = process.env.REVIEW_QUORUM_COUNT;
    process.env.REVIEW_QUORUM_ENABLED = 'true';
    process.env.REVIEW_QUORUM_COUNT = '3';
    claimFindFirst.mockResolvedValue({ id: 'c1' });
    reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }]);
    reviewerResponseCount.mockResolvedValue(2);

    const q = await resolver.reviewQuorumStatus('c1', {
      req: { user: { sub: 'u1' } },
    });

    expect(q).toEqual({
      enabled: true,
      requiredCount: 3,
      acknowledgedCount: 2,
    });
    process.env.REVIEW_QUORUM_ENABLED = prevE;
    process.env.REVIEW_QUORUM_COUNT = prevC;
  });

  describe('ADR-030 quorum gate', () => {
    let prevE: string | undefined;
    let prevC: string | undefined;

    beforeEach(() => {
      prevE = process.env.REVIEW_QUORUM_ENABLED;
      prevC = process.env.REVIEW_QUORUM_COUNT;
      process.env.REVIEW_QUORUM_ENABLED = 'true';
      process.env.REVIEW_QUORUM_COUNT = '2';
    });

    afterEach(() => {
      process.env.REVIEW_QUORUM_ENABLED = prevE;
      process.env.REVIEW_QUORUM_COUNT = prevC;
    });

    it('rejects ACCEPTED when quorum not met', async () => {
      claimFindFirst.mockResolvedValue({
        id: 'c1',
        status: 'REVIEWED',
      });
      claimEvidenceLinkCount.mockResolvedValue(1);
      reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }]);
      reviewerResponseCount.mockResolvedValue(1);

      await expect(
        resolver.adjudicateClaim(
          'c1',
          ClaimLifecycleState.ACCEPTED,
          undefined,
          { req: { user: { sub: 'u1' } } } as any,
        ),
      ).rejects.toMatchObject({
        extensions: { code: GQL_ERROR_CODES.REVIEW_QUORUM_NOT_MET },
      });
    });

    it('rejects when no ReviewRequest exists', async () => {
      claimFindFirst.mockResolvedValue({
        id: 'c1',
        status: 'REVIEWED',
      });
      claimEvidenceLinkCount.mockResolvedValue(1);
      reviewRequestFindMany.mockResolvedValue([]);

      await expect(
        resolver.adjudicateClaim(
          'c1',
          ClaimLifecycleState.REJECTED,
          undefined,
          { req: { user: { sub: 'u1' } } } as any,
        ),
      ).rejects.toMatchObject({
        extensions: { code: GQL_ERROR_CODES.REVIEW_QUORUM_NOT_MET },
      });
    });

    it('allows ACCEPTED when quorum met', async () => {
      claimFindFirst.mockResolvedValue({
        id: 'c1',
        status: 'REVIEWED',
      });
      claimEvidenceLinkCount.mockResolvedValue(1);
      reviewRequestFindMany.mockResolvedValue([{ id: 'rr1' }]);
      reviewerResponseCount.mockResolvedValue(2);
      applyAdjudication.mockResolvedValue({
        id: 'c1',
        status: ClaimStatus.ACCEPTED,
      });

      const result = await resolver.adjudicateClaim(
        'c1',
        ClaimLifecycleState.ACCEPTED,
        undefined,
        { req: { user: { sub: 'u1' } } },
      );

      expect(result.status).toBe(ClaimStatus.ACCEPTED);
    });
  });

  it('builds the GraphQL schema with ClaimAdjudicationResolver return types', async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          autoSchemaFile: true,
          driver: ApolloDriver,
        }),
      ],
      providers: [
        ClaimAdjudicationResolver,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ClaimAdjudicationService,
          useValue: adjudication,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const schema = printSchema(app.get(GraphQLSchemaHost).schema);
    expect(schema).toContain('type ReviewQuorumStatus');
    expect(schema).toContain(
      'adjudicateClaim(claimId: ID!, decision: ClaimLifecycleState!, reviewerNote: String): Claim!',
    );
    expect(schema).toContain(
      'reviewQuorumStatus(claimId: ID!): ReviewQuorumStatus!',
    );

    await app.close();
  });
});
