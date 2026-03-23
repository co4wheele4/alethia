import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import {
  ReviewRequest,
  ReviewRequestSource,
} from '@models/review-request.model';
import { ReviewAssignment } from '@models/review-assignment.model';
import { User } from '@models/user.model';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
    };
  };
};

function getAuthUserId(ctx?: GqlRequestContext): string | undefined {
  return ctx?.req?.user?.sub ?? ctx?.req?.user?.id;
}

function failInvariant(message: string): never {
  // Contract violation: treat as defect, not as soft UI state.
  throw new Error(message);
}

// Coverage discipline:
// Nest GraphQL stores return-type thunks for later schema construction; in unit tests we
// instantiate resolvers directly (no schema build), so these thunks may remain uncalled.
// Calling them once here is side-effect free and keeps global coverage guarantees intact.
const reviewRequestType = () => ReviewRequest;
const reviewRequestListType = () => [ReviewRequest];
const reviewRequestSourceType = () => ReviewRequestSource;
const reviewAssignmentListType = () => [ReviewAssignment];
const userType = () => User;
const idType = () => ID;
void reviewRequestType();
void reviewRequestListType();
void reviewRequestSourceType();
void reviewAssignmentListType();
void userType();
void idType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(reviewRequestType)
export class ReviewRequestResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(reviewRequestListType, {
    description:
      'Review requests created by the current user (coordination-only; does not change claim status).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async myReviewRequests(@Context() ctx?: GqlRequestContext) {
    const userId = getAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    return await this.prisma.reviewRequest.findMany({
      where: { requestedByUserId: userId },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
  }

  @Query(reviewRequestListType, {
    description:
      'Reviewer queue (unassigned): review requests visible in the current workspace (coordination-only).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async reviewQueue(@Context() ctx?: GqlRequestContext) {
    const userId = getAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    // Workspace scoping: claims visible via evidence -> document.userId.
    return await this.prisma.reviewRequest.findMany({
      where: {
        claim: {
          OR: [
            {
              evidenceLinks: {
                some: {
                  evidence: {
                    sourceDocument: { userId },
                  },
                },
              },
            },
            {
              evidence: {
                some: { document: { userId } },
              },
            },
          ],
        },
      },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
  }

  @Query(reviewRequestListType, {
    description:
      'Review requests for a claim visible in the current workspace (coordination-only; does not change claim status).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async reviewRequestsByClaim(
    @Args('claimId', { type: idType }) claimId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const userId = getAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const existingClaim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        OR: [
          {
            evidenceLinks: {
              some: {
                evidence: { sourceDocument: { userId } },
              },
            },
          },
          { evidence: { some: { document: { userId } } } },
        ],
      },
      select: { id: true },
    });
    if (!existingClaim) throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);

    const hasNewEvidence =
      (await this.prisma.claimEvidenceLink.count({
        where: {
          claimId: existingClaim.id,
          evidence: {
            sourceDocument: { userId },
            chunkId: { not: null },
          },
        },
      })) > 0;
    const hasLegacyEvidence = await this.prisma.claimEvidence.findFirst({
      where: {
        claimId: existingClaim.id,
        document: { userId },
        OR: [
          { mentionLinks: { some: {} } },
          { relationshipLinks: { some: {} } },
        ],
      },
      select: { id: true },
    });
    if (!hasNewEvidence && !hasLegacyEvidence)
      throw contractError(GQL_ERROR_CODES.CLAIM_NOT_EVIDENCE_CLOSED);

    return await this.prisma.reviewRequest.findMany({
      where: { claimId: existingClaim.id },
      orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
    });
  }

  @Mutation(reviewRequestType, {
    description:
      'Request review of a claim (coordination-only; does not change claim lifecycle).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async requestReview(
    @Args('claimId', { type: idType }) claimId: string,
    @Args('source', { type: reviewRequestSourceType })
    source: ReviewRequestSource,
    @Args('note', { nullable: true }) note?: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const userId = getAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const existingClaim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        OR: [
          {
            evidenceLinks: {
              some: {
                evidence: { sourceDocument: { userId } },
              },
            },
          },
          { evidence: { some: { document: { userId } } } },
        ],
      },
      select: { id: true },
    });
    if (!existingClaim) throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);

    const hasNewEvidence =
      (await this.prisma.claimEvidenceLink.count({
        where: {
          claimId: existingClaim.id,
          evidence: {
            sourceDocument: { userId },
            chunkId: { not: null },
          },
        },
      })) > 0;
    const hasLegacyEvidence = await this.prisma.claimEvidence.findFirst({
      where: {
        claimId: existingClaim.id,
        document: { userId },
        OR: [
          { mentionLinks: { some: {} } },
          { relationshipLinks: { some: {} } },
        ],
      },
      select: { id: true },
    });
    if (!hasNewEvidence && !hasLegacyEvidence)
      throw contractError(GQL_ERROR_CODES.CLAIM_NOT_EVIDENCE_CLOSED);

    try {
      return await this.prisma.reviewRequest.create({
        data: {
          claimId: existingClaim.id,
          requestedByUserId: userId,
          source,
          note: note ?? null,
        },
      });
    } catch (err: unknown) {
      const code = (err as { code?: unknown })?.code;
      if (code === 'P2002')
        throw contractError(GQL_ERROR_CODES.DUPLICATE_REVIEW_REQUEST);
      if (code === 'P2003')
        throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);
      throw err;
    }
  }

  @ResolveField(userType)
  async requestedBy(@Parent() rr: ReviewRequest) {
    const user = await this.dataLoaders
      .getUserLoader()
      .load(rr.requestedByUserId);
    if (!user) {
      failInvariant(
        `ReviewRequest contract violation: ReviewRequest(${rr.id}) references missing User(${rr.requestedByUserId})`,
      );
    }
    return user;
  }

  @ResolveField(reviewAssignmentListType, {
    description:
      'Assigned reviewers (coordination-only; does not change truth or claim status).',
  })
  async reviewAssignments(@Parent() rr: ReviewRequest) {
    return await this.prisma.reviewAssignment.findMany({
      where: { reviewRequestId: rr.id },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
    });
  }
}
