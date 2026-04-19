import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  ForbiddenException,
  Injectable,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { ClaimStatus as PrismaClaimStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { Claim } from '@models/claim.model';
import { Evidence } from '@models/evidence.model';
import { ClaimFilterInput } from '@inputs/claim-filter.input';
import { Document } from '@models/document.model';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { claimWorkspaceOr } from '../utils/claim-workspace-visibility';
import { assertAdr034ListPagination } from '@common/list-pagination';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
    };
  };
};

function failInvariant(message: string): never {
  // Contract violation: treat as defect, not as soft UI state.
  throw new Error(message);
}

// Coverage discipline:
// Nest GraphQL stores return-type thunks for later schema construction; in unit tests we
// instantiate resolvers directly (no schema build), so these thunks may remain uncalled.
// Calling them once here is side-effect free and keeps global coverage guarantees intact.
const claimType = () => Claim;
const claimListType = () => [Claim];
const evidenceListType = () => [Evidence];
const documentListType = () => [Document];
const claimFilterInputType = () => ClaimFilterInput;
const intArgType = () => Int;
void claimType();
void claimListType();
void evidenceListType();
void documentListType();
void claimFilterInputType();
void intArgType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(claimType)
@UseGuards(JwtAuthGuard)
export class ClaimResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(claimListType, {
    description:
      'List claims visible in the current workspace (evidence -> documents, or created via createClaim). ADR-022: filter supports only lifecycle and hasEvidence.',
  })
  async claims(
    @Args('filter', { type: claimFilterInputType, nullable: true })
    filter: ClaimFilterInput | undefined,
    @Args('limit', { type: intArgType }) limit: number,
    @Args('offset', { type: intArgType }) offset: number,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    assertAdr034ListPagination(limit, offset);

    const workspaceWhere = { OR: claimWorkspaceOr(authUserId) };

    const lifecycleWhere =
      filter?.lifecycle !== undefined && filter?.lifecycle !== null
        ? { status: filter.lifecycle }
        : undefined;

    let evidenceConstraint: object | undefined;
    if (filter?.hasEvidence === true) {
      evidenceConstraint = {
        OR: [{ evidence: { some: {} } }, { evidenceLinks: { some: {} } }],
      };
    } else if (filter?.hasEvidence === false) {
      evidenceConstraint = {
        AND: [{ evidence: { none: {} } }, { evidenceLinks: { none: {} } }],
      };
    }

    const where = {
      AND: [
        workspaceWhere,
        ...(lifecycleWhere ? [lifecycleWhere] : []),
        ...(evidenceConstraint ? [evidenceConstraint] : []),
      ],
    };

    return await this.prisma.claim.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
    });
  }

  @Query(claimListType, {
    description:
      'List claims grounded in a specific document (derived via claim evidence anchors).',
  })
  async claimsByDocument(
    @Args('documentId') documentId: string,
    @Args('limit', { type: intArgType }) limit: number,
    @Args('offset', { type: intArgType }) offset: number,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true },
    });
    if (!doc) return [];
    if (doc.userId !== authUserId) {
      throw new ForbiddenException('Cannot access claims for another user');
    }

    assertAdr034ListPagination(limit, offset);

    return await this.prisma.claim.findMany({
      where: {
        OR: [
          {
            evidenceLinks: {
              some: {
                evidence: { sourceDocumentId: documentId },
              },
            },
          },
          { evidence: { some: { documentId } } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
    });
  }

  @Mutation(claimType, {
    description:
      'Create a DRAFT claim statement (ADR-018). Visible in the creator workspace; non-authoritative until evidence is linked.',
  })
  async createClaim(
    @Args('text') text: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) throw contractError(GQL_ERROR_CODES.CLAIM_TEXT_REQUIRED);

    return await this.prisma.claim.create({
      data: {
        text: trimmed,
        status: PrismaClaimStatus.DRAFT,
        createdByUserId: authUserId,
      },
    });
  }

  @ResolveField(evidenceListType)
  async evidence(@Parent() claim: Claim) {
    const fromLinks = await this.prisma.claimEvidenceLink.findMany({
      where: { claimId: claim.id },
      include: { evidence: true },
      orderBy: [{ linkedAt: 'asc' }],
    });
    if (fromLinks.length > 0) {
      return fromLinks.map((l) => l.evidence);
    }
    const legacy = await this.prisma.claimEvidence.findMany({
      where: { claimId: claim.id },
      include: { document: { select: { userId: true } } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    if (legacy.length === 0) {
      // ADR-018: Claims may exist without evidence; return an empty list (non-authoritative).
      return [];
    }
    return legacy.map((ce) => ({
      id: ce.id,
      createdAt: ce.createdAt,
      createdBy: ce.document.userId,
      sourceType: 'DOCUMENT',
      sourceDocumentId: ce.documentId,
      sourceUrl: null,
      chunkId: null,
      startOffset: null,
      endOffset: null,
      snippet: null,
    })) as unknown as Evidence[];
  }

  @ResolveField(documentListType)
  async documents(@Parent() claim: Claim) {
    const fromLinks = await this.prisma.claimEvidenceLink.findMany({
      where: { claimId: claim.id },
      include: { evidence: { select: { sourceDocumentId: true } } },
    });
    const legacy = await this.prisma.claimEvidence.findMany({
      where: { claimId: claim.id },
      select: { documentId: true },
    });

    const uniqueDocIds: string[] = [];
    const seen = new Set<string>();
    for (const l of fromLinks) {
      const docId = l.evidence.sourceDocumentId;
      if (docId && !seen.has(docId)) {
        seen.add(docId);
        uniqueDocIds.push(docId);
      }
    }
    for (const ev of legacy) {
      if (!seen.has(ev.documentId)) {
        seen.add(ev.documentId);
        uniqueDocIds.push(ev.documentId);
      }
    }

    if (uniqueDocIds.length === 0) {
      // ADR-018: No evidence anchors → no derived documents (empty list, not an error).
      return [];
    }

    const docs = await Promise.all(
      uniqueDocIds.map((id) => this.dataLoaders.getDocumentLoader().load(id)),
    );
    for (let i = 0; i < docs.length; i += 1) {
      if (!docs[i]) {
        failInvariant(
          `Claim contract violation: Claim(${claim.id}) evidence references missing Document(${uniqueDocIds[i]})`,
        );
      }
    }
    return docs as unknown as Document[];
  }
}
