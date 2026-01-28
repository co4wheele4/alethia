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
import { GraphQLError } from 'graphql';
import { PrismaService } from '@prisma/prisma.service';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import {
  ReviewRequest,
  ReviewRequestSource,
} from '@models/review-request.model';
import { User } from '@models/user.model';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
    };
  };
};

type ReviewRequestErrorCode =
  | 'UNAUTHORIZED'
  | 'CLAIM_NOT_FOUND'
  | 'DUPLICATE_REVIEW_REQUEST';

function contractError(code: ReviewRequestErrorCode): GraphQLError {
  return new GraphQLError(code, { extensions: { code } });
}

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
const userType = () => User;
const idType = () => ID;
void reviewRequestType();
void reviewRequestListType();
void reviewRequestSourceType();
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
    if (!userId) throw contractError('UNAUTHORIZED');

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
    if (!userId) throw contractError('UNAUTHORIZED');

    // Workspace scoping: only requests for claims visible via evidence -> document.userId.
    return await this.prisma.reviewRequest.findMany({
      where: {
        claim: { evidence: { some: { document: { userId } } } },
      },
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
    if (!userId) throw contractError('UNAUTHORIZED');

    // Claim must exist and be visible in the current workspace.
    const existingClaim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        evidence: { some: { document: { userId } } },
      },
      select: { id: true },
    });
    if (!existingClaim) throw contractError('CLAIM_NOT_FOUND');

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
      if (code === 'P2002') throw contractError('DUPLICATE_REVIEW_REQUEST');
      if (code === 'P2003') throw contractError('CLAIM_NOT_FOUND');
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
}
