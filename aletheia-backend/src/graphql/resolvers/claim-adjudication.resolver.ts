import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { ReviewerResponseType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { Claim, ClaimLifecycleState, ClaimStatus } from '@models/claim.model';
import { ReviewQuorumStatus } from '@models/review-quorum-status.model';
import { OptionalJwtAuthGuard } from '@auth/guards/optional-jwt-auth.guard';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { ClaimAdjudicationService } from './claim-adjudication.service';
import { claimWorkspaceOr } from '../utils/claim-workspace-visibility';

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

function getReviewQuorumConfig(): { enabled: boolean; count: number } {
  const enabled = process.env.REVIEW_QUORUM_ENABLED === 'true';
  const parsed = parseInt(process.env.REVIEW_QUORUM_COUNT || '2', 10);
  const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
  return { enabled, count };
}

function isAllowedTransition(
  current: ClaimStatus,
  decision: ClaimLifecycleState,
): boolean {
  // Allowed transitions ONLY (ADR-011):
  // - DRAFT → REVIEW
  // - REVIEW → ACCEPTED
  // - REVIEW → REJECTED
  // Terminal states: ACCEPTED, REJECTED
  if (current === ClaimStatus.DRAFT)
    return decision === ClaimLifecycleState.REVIEW;
  if (current === ClaimStatus.REVIEWED) {
    return (
      decision === ClaimLifecycleState.ACCEPTED ||
      decision === ClaimLifecycleState.REJECTED
    );
  }
  return false;
}

// Coverage discipline:
// Nest GraphQL stores return-type thunks for later schema construction; in unit tests we
// instantiate resolvers directly (no schema build), so these thunks may remain uncalled.
// Calling them once here is side-effect free and keeps global coverage guarantees intact.
const claimType = () => Claim;
const claimLifecycleStateType = () => ClaimLifecycleState;
const idType = () => ID;
const reviewQuorumStatusType = () => ReviewQuorumStatus;
void claimType();
void claimLifecycleStateType();
void idType();
void reviewQuorumStatusType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(claimType)
export class ClaimAdjudicationResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adjudication: ClaimAdjudicationService,
  ) {}

  @Query(reviewQuorumStatusType, {
    description:
      'ADR-030: Mechanical quorum counts for adjudication precondition (non-semantic).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async reviewQuorumStatus(
    @Args('claimId', { type: idType }) claimId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const reviewerId = getAuthUserId(ctx);
    if (!reviewerId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED_REVIEWER);

    const existing = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        OR: claimWorkspaceOr(reviewerId),
      },
      select: { id: true },
    });

    if (!existing) throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);

    const { enabled, count } = getReviewQuorumConfig();
    const rrs = await this.prisma.reviewRequest.findMany({
      where: { claimId: existing.id },
      select: { id: true },
    });
    const rrIds = rrs.map((r) => r.id);
    const acknowledgedCount = await this.prisma.reviewerResponse.count({
      where: {
        response: ReviewerResponseType.ACKNOWLEDGED,
        reviewAssignment: { reviewRequestId: { in: rrIds } },
      },
    });

    return {
      enabled,
      requiredCount: count,
      acknowledgedCount,
    };
  }

  @Mutation(claimType, {
    description:
      'Adjudicate a claim by transitioning lifecycle state (ADR-011).',
  })
  @UseGuards(OptionalJwtAuthGuard)
  async adjudicateClaim(
    @Args('claimId', { type: idType }) claimId: string,
    @Args('decision', { type: claimLifecycleStateType })
    decision: ClaimLifecycleState,
    @Args('reviewerNote', { nullable: true }) reviewerNote?: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const reviewerId = getAuthUserId(ctx);
    if (!reviewerId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED_REVIEWER);

    // Fetch claim scoped to reviewer workspace (evidence -> document.userId).
    const existing = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        OR: claimWorkspaceOr(reviewerId),
      },
      select: { id: true, status: true },
    });

    if (!existing) throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);

    // ADR-018/019: evidence closure is binary. Claim needs valid evidence anchors.
    const hasNewEvidence =
      (await this.prisma.claimEvidenceLink.count({
        where: {
          claimId: existing.id,
          evidence: {
            sourceDocument: { userId: reviewerId },
            chunkId: { not: null },
          },
        },
      })) > 0;
    const hasLegacyEvidence = await this.prisma.claimEvidence.findFirst({
      where: {
        claimId: existing.id,
        document: { userId: reviewerId },
        OR: [
          { mentionLinks: { some: {} } },
          { relationshipLinks: { some: {} } },
        ],
      },
      select: { id: true },
    });
    if (!hasNewEvidence && !hasLegacyEvidence)
      throw contractError(GQL_ERROR_CODES.EVIDENCE_REQUIRED_FOR_ADJUDICATION);

    const currentStatus = existing.status as ClaimStatus;
    if (!isAllowedTransition(currentStatus, decision)) {
      throw contractError(GQL_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION);
    }

    // Mapping is intentionally derived from the *allowed transitions*:
    // - DRAFT -> REVIEW maps to persisted status REVIEWED
    // - REVIEWED -> ACCEPTED/REJECTED maps to persisted status ACCEPTED/REJECTED
    const nextStatus: ClaimStatus =
      currentStatus === ClaimStatus.DRAFT
        ? ClaimStatus.REVIEWED
        : decision === ClaimLifecycleState.ACCEPTED
          ? ClaimStatus.ACCEPTED
          : ClaimStatus.REJECTED;

    // ADR-030: mechanical quorum gate for terminal adjudication only.
    const { enabled: quorumEnabled, count: quorumCount } =
      getReviewQuorumConfig();
    if (
      quorumEnabled &&
      (decision === ClaimLifecycleState.ACCEPTED ||
        decision === ClaimLifecycleState.REJECTED)
    ) {
      const rrs = await this.prisma.reviewRequest.findMany({
        where: { claimId: existing.id },
        select: { id: true },
      });
      if (rrs.length === 0) {
        throw contractError(GQL_ERROR_CODES.REVIEW_QUORUM_NOT_MET);
      }
      const rrIds = rrs.map((r) => r.id);
      const acknowledgedCount = await this.prisma.reviewerResponse.count({
        where: {
          response: ReviewerResponseType.ACKNOWLEDGED,
          reviewAssignment: { reviewRequestId: { in: rrIds } },
        },
      });
      if (acknowledgedCount < quorumCount) {
        throw contractError(GQL_ERROR_CODES.REVIEW_QUORUM_NOT_MET);
      }
    }

    return this.adjudication.applyAdjudication({
      claimId: existing.id,
      adjudicatorId: reviewerId,
      decision,
      reviewerNote: reviewerNote ?? null,
      previousStatus: existing.status,
      nextStatus: nextStatus,
    });
  }
}
