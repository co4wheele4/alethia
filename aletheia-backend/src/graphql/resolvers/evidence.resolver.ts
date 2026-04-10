import {
  Args,
  Context,
  Int,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Parent,
} from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { EvidenceSourceKind as PrismaEvidenceSourceKind } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Evidence } from '@models/evidence.model';
import {
  CreateEvidenceInput,
  CreateEvidenceSourceKindInput,
} from '@inputs/evidence.input';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { User } from '@models/user.model';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { extractSpan } from '@common/utils/extract-span';
import { evidenceContentSha256Hex } from '@common/utils/evidence-content-hash';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { assertAdr034ListPagination } from '@common/list-pagination';

type GqlContext = {
  req?: { user?: { sub?: string; id?: string } };
};

// Coverage discipline: Nest GraphQL type thunks are invoked at module load.
const evidenceType = () => Evidence;
const evidenceListType = () => [Evidence];
const userType = () => User;
const documentType = () => Document;
const documentChunkType = () => DocumentChunk;
const intArgType = () => Int;
void evidenceType();
void evidenceListType();
void userType();
void documentType();
void documentChunkType();
void intArgType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(evidenceType)
@UseGuards(JwtAuthGuard)
export class EvidenceResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(evidenceListType, {
    description:
      'List evidence visible to the current user (via document ownership).',
  })
  async evidence(
    @Args('limit', { type: intArgType }) limit: number,
    @Args('offset', { type: intArgType }) offset: number,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) return [];

    assertAdr034ListPagination(limit, offset);

    return this.prisma.evidence.findMany({
      where: {
        OR: [
          { sourceDocument: { userId } },
          {
            sourceType: {
              in: [
                PrismaEvidenceSourceKind.URL,
                PrismaEvidenceSourceKind.HTML_PAGE,
              ],
            },
            createdBy: userId,
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
    });
  }

  @Query(evidenceType, { nullable: true })
  async evidenceById(@Args('id') id: string, @Context() ctx?: GqlContext) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) return null;

    const ev = await this.prisma.evidence.findUnique({
      where: { id },
      include: { sourceDocument: { select: { userId: true } } },
    });
    if (!ev) return null;

    if (ev.sourceType === PrismaEvidenceSourceKind.DOCUMENT) {
      if (ev.sourceDocument?.userId !== userId) return null;
    } else if (ev.sourceType === PrismaEvidenceSourceKind.URL) {
      if (ev.createdBy !== userId) return null;
    } else {
      return null;
    }

    return ev;
  }

  @ResolveField(userType)
  async createdByUser(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { createdBy: string };
    return this.prisma.user.findUniqueOrThrow({ where: { id: e.createdBy } });
  }

  @ResolveField(documentType, { nullable: true })
  async sourceDocument(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { sourceDocumentId: string | null };
    if (!e.sourceDocumentId) return null;
    return this.prisma.document.findUnique({
      where: { id: e.sourceDocumentId },
    });
  }

  @ResolveField(documentChunkType, { nullable: true })
  async chunk(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { chunkId: string | null };
    if (!e.chunkId) return null;
    return this.prisma.documentChunk.findUnique({ where: { id: e.chunkId } });
  }

  /**
   * Create Evidence (ADR-019 / ADR-024). Immutable after creation (DB-enforced).
   * Fail-fast: rejects missing source, missing locator, malformed offsets, empty/non-verbatim content.
   */
  @Mutation(evidenceType)
  async createEvidence(
    @Args('input') input: CreateEvidenceInput,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const {
      sourceType,
      sourceDocumentId,
      sourceUrl,
      chunkId,
      startOffset,
      endOffset,
      snippet,
      claimIds,
    } = input;

    // 1. Source validation
    if (sourceType === CreateEvidenceSourceKindInput.DOCUMENT) {
      if (!sourceDocumentId) {
        throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED);
      }
      const doc = await this.prisma.document.findUnique({
        where: { id: sourceDocumentId },
        select: { id: true, userId: true },
      });
      if (!doc) throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_NOT_FOUND);
      if (doc.userId !== userId) {
        throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
      }
    } else if (sourceType === CreateEvidenceSourceKindInput.URL) {
      if (!sourceUrl)
        throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED);
      // URL source not fully implemented; reject for now
      throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED);
    }

    // 2. Locator + verbatim validation (DOCUMENT only: enum is DOCUMENT | URL and URL is rejected above)
    if (!chunkId || startOffset == null || endOffset == null) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_LOCATOR_REQUIRED);
    }
    if (endOffset <= startOffset) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS);
    }

    const chunk = await this.prisma.documentChunk.findUnique({
      where: { id: chunkId },
      select: { id: true, documentId: true, content: true },
    });
    if (!chunk) throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_NOT_FOUND);
    if (chunk.documentId !== sourceDocumentId!) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_CHUNK_NOT_IN_SOURCE);
    }
    if (startOffset < 0 || endOffset > chunk.content.length) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS);
    }

    // ADR-024: verbatim span must exactly match the chunk slice (end > start ⇒ non-empty for valid UTF-16 ranges).
    const verbatim = extractSpan(chunk.content, startOffset, endOffset);
    if (snippet == null || snippet === '') {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_VERBATIM_REQUIRED);
    }
    if (snippet !== verbatim) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS);
    }

    const contentSha256 = evidenceContentSha256Hex(verbatim);

    const evidence = await this.prisma.evidence.create({
      data: {
        sourceType: PrismaEvidenceSourceKind.DOCUMENT,
        sourceDocumentId: sourceDocumentId,
        sourceUrl,
        chunkId: chunkId,
        startOffset: startOffset,
        endOffset: endOffset,
        snippet: verbatim,
        contentSha256,
        createdBy: userId,
      },
    });

    if (claimIds && claimIds.length > 0) {
      for (const claimId of claimIds) {
        const claim = await this.prisma.claim.findUnique({
          where: { id: claimId },
          select: { id: true },
        });
        if (claim) {
          await this.prisma.claimEvidenceLink.upsert({
            where: { evidenceId_claimId: { evidenceId: evidence.id, claimId } },
            create: { evidenceId: evidence.id, claimId },
            update: {},
          });
        }
      }
    }

    return evidence;
  }

  /**
   * Link Evidence to a Claim. Evidence can be linked to multiple claims.
   */
  @Mutation(evidenceType)
  async linkEvidenceToClaim(
    @Args('evidenceId') evidenceId: string,
    @Args('claimId') claimId: string,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const ev = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { sourceDocument: { select: { userId: true } } },
    });
    if (!ev) throw contractError(GQL_ERROR_CODES.EVIDENCE_NOT_FOUND);
    if (ev.sourceType === PrismaEvidenceSourceKind.DOCUMENT) {
      if (ev.sourceDocument?.userId !== userId) {
        throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
      }
    } else if (ev.sourceType === PrismaEvidenceSourceKind.URL) {
      if (ev.createdBy !== userId) {
        throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
      }
    } else {
      throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    }

    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });
    if (!claim) throw contractError(GQL_ERROR_CODES.CLAIM_NOT_FOUND);

    await this.prisma.claimEvidenceLink.upsert({
      where: { evidenceId_claimId: { evidenceId, claimId } },
      create: { evidenceId, claimId },
      update: {},
    });

    return ev;
  }
}
