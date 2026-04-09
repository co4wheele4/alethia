import { Injectable } from '@nestjs/common';
import { ClaimStatus } from '@prisma/client';

import { PrismaService } from '@prisma/prisma.service';
import { ClaimLifecycleState } from '@models/claim.model';

/**
 * ADR-023: Sole service path that mutates claim status for adjudication.
 * Writes adjudication_logs + claim in one transaction.
 */
@Injectable()
export class ClaimAdjudicationService {
  constructor(private readonly prisma: PrismaService) {}

  async applyAdjudication(args: {
    claimId: string;
    adjudicatorId: string;
    decision: ClaimLifecycleState;
    reviewerNote: string | null;
    previousStatus: ClaimStatus;
    nextStatus: ClaimStatus;
  }) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.adjudicationLog.create({
        data: {
          claimId: args.claimId,
          adjudicatorId: args.adjudicatorId,
          decision: String(args.decision),
          previousStatus: args.previousStatus,
          newStatus: args.nextStatus,
          reviewerNote: args.reviewerNote,
        },
      });
      return tx.claim.update({
        where: { id: args.claimId },
        data: {
          status: args.nextStatus,
          reviewedAt: now,
          reviewedBy: args.adjudicatorId,
          reviewerNote: args.reviewerNote,
        },
      });
    });
  }
}
