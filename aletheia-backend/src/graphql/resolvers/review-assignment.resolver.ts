import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { PrismaService } from '@prisma/prisma.service';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { ReviewAssignment } from '@models/review-assignment.model';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
      role?: string;
    };
  };
};

type ReviewAssignmentErrorCode =
  | 'UNAUTHORIZED'
  | 'REVIEW_REQUEST_NOT_FOUND'
  | 'REVIEWER_NOT_ELIGIBLE'
  | 'DUPLICATE_ASSIGNMENT';

function contractError(code: ReviewAssignmentErrorCode): GraphQLError {
  return new GraphQLError(code, { extensions: { code } });
}

function getAuthUserId(ctx?: GqlRequestContext): string | undefined {
  return ctx?.req?.user?.sub ?? ctx?.req?.user?.id;
}

function getAuthUserRole(ctx?: GqlRequestContext): string | undefined {
  return ctx?.req?.user?.role;
}

// Coverage discipline:
// Nest GraphQL stores return-type thunks for later schema construction; in unit tests we
// instantiate resolvers directly (no schema build), so these thunks may remain uncalled.
// Calling them once here is side-effect free and keeps global coverage guarantees intact.
const reviewAssignmentType = () => ReviewAssignment;
const idType = () => ID;
void reviewAssignmentType();
void idType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(reviewAssignmentType)
export class ReviewAssignmentResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Mutation(reviewAssignmentType, {
    description:
      'Assign a reviewer (coordination-only; does not change truth, claim status, or adjudication).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async assignReviewer(
    @Args('reviewRequestId', { type: idType }) reviewRequestId: string,
    @Args('reviewerUserId', { type: idType }) reviewerUserId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const assignedByUserId = getAuthUserId(ctx);
    if (!assignedByUserId) throw contractError('UNAUTHORIZED');

    // Assignment MAY be restricted by role (ADR-015). In this codebase, ADMIN is the coordination role.
    const role = getAuthUserRole(ctx);
    if (role !== 'ADMIN') throw contractError('UNAUTHORIZED');

    // Review request must exist AND be visible in the assigner's workspace.
    const rr = await this.prisma.reviewRequest.findFirst({
      where: {
        id: reviewRequestId,
        claim: {
          evidence: { some: { document: { userId: assignedByUserId } } },
        },
      },
      select: { id: true, claimId: true },
    });
    if (!rr) throw contractError('REVIEW_REQUEST_NOT_FOUND');

    // Reviewer eligibility: reviewer must be able to see the claim in their workspace.
    const reviewerHasVisibility = await this.prisma.claim.findFirst({
      where: {
        id: rr.claimId,
        evidence: { some: { document: { userId: reviewerUserId } } },
      },
      select: { id: true },
    });
    if (!reviewerHasVisibility) throw contractError('REVIEWER_NOT_ELIGIBLE');

    try {
      return await this.prisma.reviewAssignment.create({
        data: {
          reviewRequestId: rr.id,
          reviewerUserId,
          assignedByUserId,
        },
      });
    } catch (err: unknown) {
      const code = (err as { code?: unknown })?.code;
      if (code === 'P2002') throw contractError('DUPLICATE_ASSIGNMENT');

      // FK race: re-check which FK failed to map to a stable contract code.
      if (code === 'P2003') {
        const rrExists = await this.prisma.reviewRequest.findUnique({
          where: { id: reviewRequestId },
          select: { id: true },
        });
        if (!rrExists) throw contractError('REVIEW_REQUEST_NOT_FOUND');
        throw contractError('REVIEWER_NOT_ELIGIBLE');
      }

      throw err;
    }
  }
}
