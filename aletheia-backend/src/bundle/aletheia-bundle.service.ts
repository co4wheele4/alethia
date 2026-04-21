import { Injectable } from '@nestjs/common';
import { ClaimStatus, Prisma } from '@prisma/client';

/** ADR-027: insert imported claims as DRAFT first, then apply bundle status after evidence/links/logs exist. */
function claimDraftForImport(
  row: Prisma.ClaimCreateManyInput,
): Prisma.ClaimCreateManyInput {
  return {
    ...row,
    status: ClaimStatus.DRAFT,
    reviewedAt: null,
    reviewedBy: null,
    reviewerNote: null,
  };
}
import { PrismaService } from '@prisma/prisma.service';
import {
  contractError,
  GQL_ERROR_CODES,
} from '../graphql/errors/graphql-error-codes';
import { evidenceContentSha256Hex } from '../common/utils/evidence-content-hash';

const BUNDLE_VERSION = '1';

/** ADR-037: Reject semantic extension keys at import boundary (recursive, case-insensitive on keys). */
const FORBIDDEN_IMPORT_KEYS = new Set([
  'confidence',
  'score',
  'rank',
  'relevance',
  'similarity',
  'embedding',
]);

function assertNoForbiddenImportKeys(value: unknown, path: string): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoForbiddenImportKeys(v, `${path}[${i}]`));
    return;
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (FORBIDDEN_IMPORT_KEYS.has(k.toLowerCase())) {
        throw contractError(GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED);
      }
      assertNoForbiddenImportKeys(o[k], `${path}.${k}`);
    }
  }
}

export type ExportBundleInput = {
  claimIds?: string[];
  lifecycle?: ClaimStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  includeEpistemicEvents?: boolean;
  epistemicEventsAfter?: Date;
  epistemicEventsBefore?: Date;
};

export type AletheiaBundleRecord = {
  version: string;
  exportedAt: string;
  claims: unknown[];
  evidence: unknown[];
  claimEvidenceLinks: unknown[];
  adjudicationLogs: unknown[];
  reviewRequests: unknown[];
  reviewAssignments: unknown[];
  reviewerResponses: unknown[];
  evidenceReproChecks: unknown[];
  epistemicEvents: unknown[];
};

@Injectable()
export class AletheiaBundleService {
  constructor(private readonly prisma: PrismaService) {}

  async exportBundle(input: ExportBundleInput): Promise<AletheiaBundleRecord> {
    const where: Prisma.ClaimWhereInput = {};
    if (input.claimIds?.length) where.id = { in: input.claimIds };
    if (input.lifecycle) where.status = input.lifecycle;
    if (input.createdAfter || input.createdBefore) {
      where.createdAt = {};
      if (input.createdAfter) where.createdAt.gte = input.createdAfter;
      if (input.createdBefore) where.createdAt.lte = input.createdBefore;
    }

    const claims = await this.prisma.claim.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const claimIds = claims.map((c) => c.id);

    const links = await this.prisma.claimEvidenceLink.findMany({
      where: { claimId: { in: claimIds } },
    });
    const evidenceIds = [...new Set(links.map((l) => l.evidenceId))];
    const evidence = await this.prisma.evidence.findMany({
      where: { id: { in: evidenceIds } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const adjudicationLogs = await this.prisma.adjudicationLog.findMany({
      where: { claimId: { in: claimIds } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const reviewRequests = await this.prisma.reviewRequest.findMany({
      where: { claimId: { in: claimIds } },
      orderBy: [{ requestedAt: 'asc' }, { id: 'asc' }],
    });
    const rrIds = reviewRequests.map((r) => r.id);

    const reviewAssignments = await this.prisma.reviewAssignment.findMany({
      where: { reviewRequestId: { in: rrIds } },
      orderBy: [{ assignedAt: 'asc' }, { id: 'asc' }],
    });
    const raIds = reviewAssignments.map((a) => a.id);

    const reviewerResponses = await this.prisma.reviewerResponse.findMany({
      where: { reviewAssignmentId: { in: raIds } },
      orderBy: [{ respondedAt: 'asc' }, { id: 'asc' }],
    });

    const evidenceReproChecks = await this.prisma.evidenceReproCheck.findMany({
      where: { evidenceId: { in: evidenceIds } },
      orderBy: [{ checkedAt: 'asc' }, { id: 'asc' }],
    });

    let epistemicEvents: unknown[] = [];
    if (input.includeEpistemicEvents) {
      const ew: Prisma.EpistemicEventWhereInput = {};
      if (input.epistemicEventsAfter || input.epistemicEventsBefore) {
        ew.createdAt = {};
        if (input.epistemicEventsAfter)
          ew.createdAt.gte = input.epistemicEventsAfter;
        if (input.epistemicEventsBefore)
          ew.createdAt.lte = input.epistemicEventsBefore;
      }
      epistemicEvents = await this.prisma.epistemicEvent.findMany({
        where: ew,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
    }

    return {
      version: BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
      claims: claims,
      evidence: evidence,
      claimEvidenceLinks: links,
      adjudicationLogs: adjudicationLogs,
      reviewRequests: reviewRequests,
      reviewAssignments: reviewAssignments,
      reviewerResponses: reviewerResponses,
      evidenceReproChecks: evidenceReproChecks,
      epistemicEvents,
    };
  }

  async importBundle(
    bundle: AletheiaBundleRecord,
    allowOverwrite: boolean,
  ): Promise<{ importedClaims: number; importedEvidence: number }> {
    if (!bundle || bundle.version !== BUNDLE_VERSION)
      throw contractError(GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED);

    assertNoForbiddenImportKeys(bundle, 'bundle');

    const claimsIn = bundle.claims as Array<{ id: string }>;
    const evidenceIn = bundle.evidence as Array<{
      id: string;
      snippet: string | null;
      contentSha256: string | null;
    }>;

    for (const e of evidenceIn) {
      if (e.snippet != null && e.contentSha256) {
        const h = evidenceContentSha256Hex(e.snippet);
        if (h !== e.contentSha256)
          throw contractError(GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED);
      }
    }

    const claimIdList: string[] = [];
    for (const c of claimsIn) claimIdList.push(c.id);

    const existingClaim = await this.prisma.claim.findFirst({
      where: { id: { in: claimIdList } },
      select: { id: true },
    });
    if (existingClaim && !allowOverwrite)
      throw contractError(GQL_ERROR_CODES.IMPORT_COLLISION);

    const evidenceIdList: string[] = [];
    for (const e of evidenceIn) evidenceIdList.push(e.id);

    const existingEv = await this.prisma.evidence.findFirst({
      where: { id: { in: evidenceIdList } },
      select: { id: true },
    });
    if (existingEv && !allowOverwrite)
      throw contractError(GQL_ERROR_CODES.IMPORT_COLLISION);

    const originals = bundle.claims as Prisma.ClaimCreateManyInput[];
    const draftClaims = originals.map((c) => claimDraftForImport(c));

    return this.prisma.$transaction(async (tx) => {
      if (allowOverwrite && (existingClaim || existingEv)) {
        const claimIds = claimIdList;
        const evIds = evidenceIdList;
        await tx.reviewerResponse.deleteMany({
          where: {
            reviewAssignment: {
              reviewRequest: { claimId: { in: claimIds } },
            },
          },
        });
        await tx.reviewAssignment.deleteMany({
          where: { reviewRequest: { claimId: { in: claimIds } } },
        });
        await tx.reviewRequest.deleteMany({
          where: { claimId: { in: claimIds } },
        });
        await tx.adjudicationLog.deleteMany({
          where: { claimId: { in: claimIds } },
        });
        await tx.claimEvidenceLink.deleteMany({
          where: {
            OR: [{ claimId: { in: claimIds } }, { evidenceId: { in: evIds } }],
          },
        });
        await tx.evidenceReproCheck.deleteMany({
          where: { evidenceId: { in: evIds } },
        });
        await tx.claim.deleteMany({ where: { id: { in: claimIds } } });
        await tx.evidence.deleteMany({ where: { id: { in: evIds } } });
      }

      // ADR-027 order: evidence → claims (DRAFT) → links → adjudication logs → restore statuses → coordination → repro → events
      if (evidenceIn.length) {
        await tx.evidence.createMany({
          data: bundle.evidence as Prisma.EvidenceCreateManyInput[],
        });
      }
      if (draftClaims.length) {
        await tx.claim.createMany({
          data: draftClaims,
        });
      }
      const linksIn =
        bundle.claimEvidenceLinks as Prisma.ClaimEvidenceLinkCreateManyInput[];
      if (linksIn.length) {
        await tx.claimEvidenceLink.createMany({ data: linksIn });
      }
      const logsIn =
        bundle.adjudicationLogs as Prisma.AdjudicationLogCreateManyInput[];
      if (logsIn.length) {
        await tx.adjudicationLog.createMany({ data: logsIn });
      }

      for (const orig of originals) {
        const target = orig.status ?? ClaimStatus.DRAFT;
        if (target === ClaimStatus.DRAFT) continue;
        await tx.claim.update({
          where: { id: orig.id as string },
          data: {
            status: target,
            reviewedAt: orig.reviewedAt ?? null,
            reviewedBy: orig.reviewedBy ?? null,
            reviewerNote: orig.reviewerNote ?? null,
          },
        });
      }

      const rrIn =
        bundle.reviewRequests as Prisma.ReviewRequestCreateManyInput[];
      if (rrIn.length) {
        await tx.reviewRequest.createMany({ data: rrIn });
      }
      const raIn =
        bundle.reviewAssignments as Prisma.ReviewAssignmentCreateManyInput[];
      if (raIn.length) {
        await tx.reviewAssignment.createMany({ data: raIn });
      }
      const respIn =
        bundle.reviewerResponses as Prisma.ReviewerResponseCreateManyInput[];
      if (respIn.length) {
        await tx.reviewerResponse.createMany({ data: respIn });
      }
      const ercIn =
        bundle.evidenceReproChecks as Prisma.EvidenceReproCheckCreateManyInput[];
      if (ercIn.length) {
        await tx.evidenceReproCheck.createMany({ data: ercIn });
      }
      const epIn =
        bundle.epistemicEvents as Prisma.EpistemicEventCreateManyInput[];
      if (epIn.length) {
        await tx.epistemicEvent.createMany({ data: epIn });
      }

      return {
        importedClaims: claimsIn.length,
        importedEvidence: evidenceIn.length,
      };
    });
  }
}
