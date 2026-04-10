import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { adjudicationEntryHashHex } from '../common/integrity/adjudication-entry-hash';

export type IntegrityReportResult = {
  adjudicationMissingHashCount: number;
  adjudicationBrokenChainCount: number;
  adjudicationHashMismatchCount: number;
  evidenceMissingContentHashCount: number;
};

/**
 * ADR-036: Structural integrity checks only (no trust scores).
 */
@Injectable()
export class IntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAdjudicationChain(): Promise<IntegrityReportResult> {
    const logs = await this.prisma.adjudicationLog.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    let adjudicationMissingHashCount = 0;
    let adjudicationBrokenChainCount = 0;
    let adjudicationHashMismatchCount = 0;
    let prevEntryHash: string | null = null;

    for (const log of logs) {
      if (!log.entryHash) {
        adjudicationMissingHashCount += 1;
        continue;
      }
      if (log.prevHash !== prevEntryHash) {
        adjudicationBrokenChainCount += 1;
      }
      const expected = adjudicationEntryHashHex({
        prevHash: log.prevHash,
        claimId: log.claimId,
        adjudicatorId: log.adjudicatorId,
        decision: log.decision,
        createdAt: log.createdAt,
      });
      if (expected !== log.entryHash) {
        adjudicationHashMismatchCount += 1;
      }
      prevEntryHash = log.entryHash;
    }

    const evidenceMissing = await this.prisma.evidence.count({
      where: { contentSha256: null },
    });

    return {
      adjudicationMissingHashCount,
      adjudicationBrokenChainCount,
      adjudicationHashMismatchCount,
      evidenceMissingContentHashCount: evidenceMissing,
    };
  }
}
