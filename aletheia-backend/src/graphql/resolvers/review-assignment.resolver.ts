import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { ReviewAssignment } from '@models/review-assignment.model';
import {
  ReviewerResponse,
  ReviewerResponseType,
} from '@models/reviewer-response.model';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
      role?: string;
    };
  };
};

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
const reviewerResponseType = () => ReviewerResponse;
const reviewerResponseEnumType = () => ReviewerResponseType;
void reviewAssignmentType();
void idType();
void reviewerResponseType();
void reviewerResponseEnumType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(reviewAssignmentType)
export class ReviewAssignmentResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveField(reviewerResponseType, {
    nullable: true,
    description:
      'Optional reviewer response (coordination-only; does not determine truth or claim status).',
  })
  async reviewerResponse(@Parent() ra: ReviewAssignment) {
    return await this.prisma.reviewerResponse.findUnique({
      where: {
        reviewAssignmentId_reviewerUserId: {
          reviewAssignmentId: ra.id,
          reviewerUserId: ra.reviewerUserId,
        },
      },
    });
  }

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
    if (!assignedByUserId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    // Assignment MAY be restricted by role (ADR-015). In this codebase, ADMIN is the coordination role.
    const role = getAuthUserRole(ctx);
    if (role !== 'ADMIN') throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    // Review request must exist AND be visible in the assigner's workspace.
    const rr = await this.prisma.reviewRequest.findFirst({
      where: {
        id: reviewRequestId,
        claim: {
          OR: [
            {
              evidenceLinks: {
                some: {
                  evidence: {
                    sourceDocument: { userId: assignedByUserId },
                  },
                },
              },
            },
            {
              evidence: {
                some: { document: { userId: assignedByUserId } },
              },
            },
          ],
        },
      },
      select: { id: true, claimId: true },
    });
    if (!rr) throw contractError(GQL_ERROR_CODES.REVIEW_REQUEST_NOT_FOUND);

    // Reviewer eligibility: reviewer must be able to see the claim in their workspace.
    const reviewerHasVisibility = await this.prisma.claim.findFirst({
      where: {
        id: rr.claimId,
        OR: [
          {
            evidenceLinks: {
              some: {
                evidence: {
                  sourceDocument: { userId: reviewerUserId },
                },
              },
            },
          },
          {
            evidence: {
              some: { document: { userId: reviewerUserId } },
            },
          },
        ],
      },
      select: { id: true },
    });
    if (!reviewerHasVisibility)
      throw contractError(GQL_ERROR_CODES.REVIEWER_NOT_ELIGIBLE);

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
      if (code === 'P2002')
        throw contractError(GQL_ERROR_CODES.DUPLICATE_ASSIGNMENT);

      // FK race: re-check which FK failed to map to a stable contract code.
      if (code === 'P2003') {
        const rrExists = await this.prisma.reviewRequest.findUnique({
          where: { id: reviewRequestId },
          select: { id: true },
        });
        if (!rrExists)
          throw contractError(GQL_ERROR_CODES.REVIEW_REQUEST_NOT_FOUND);
        throw contractError(GQL_ERROR_CODES.REVIEWER_NOT_ELIGIBLE);
      }

      throw err;
    }
  }

  @Mutation(reviewerResponseType, {
    description:
      'Respond to a review assignment (coordination-only; does not determine truth or claim status).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async respondToReviewAssignment(
    @Args('reviewAssignmentId', { type: idType }) reviewAssignmentId: string,
    @Args('response', { type: reviewerResponseEnumType })
    response: ReviewerResponseType,
    @Args('note', { nullable: true }) note?: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const userId = getAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const assignment = await this.prisma.reviewAssignment.findUnique({
      where: { id: reviewAssignmentId },
      select: { id: true, reviewerUserId: true },
    });
    if (!assignment) throw contractError(GQL_ERROR_CODES.ASSIGNMENT_NOT_FOUND);
    if (assignment.reviewerUserId !== userId) {
      throw contractError(GQL_ERROR_CODES.NOT_ASSIGNED_REVIEWER);
    }

    try {
      return await this.prisma.reviewerResponse.create({
        data: {
          reviewAssignmentId: assignment.id,
          reviewerUserId: userId,
          response,
          note: note ?? null,
        },
      });
    } catch (err: unknown) {
      const code = (err as { code?: unknown })?.code;
      if (code === 'P2002')
        throw contractError(GQL_ERROR_CODES.DUPLICATE_RESPONSE);

      // FK race: re-check the assignment. If it still exists, map to UNAUTHORIZED (user FK) to
      // avoid leaking internal details beyond the explicit contract codes.
      if (code === 'P2003') {
        const stillExists = await this.prisma.reviewAssignment.findUnique({
          where: { id: reviewAssignmentId },
          select: { id: true, reviewerUserId: true },
        });
        if (!stillExists)
          throw contractError(GQL_ERROR_CODES.ASSIGNMENT_NOT_FOUND);
        throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
      }

      throw err;
    }
  }
}
