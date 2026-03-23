import {
  Args,
  Context,
  Mutation,
  Query,
  ResolveField,
  Resolver,
  Parent,
} from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Evidence, EvidenceSourceKind } from '@models/evidence.model';
import {
  CreateEvidenceInput,
  CreateEvidenceSourceKindInput,
} from '@inputs/evidence.input';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { User } from '@models/user.model';
import { Document } from '@models/document.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { extractSpan } from '@common/utils/extract-span';

type GqlContext = {
  req?: { user?: { sub?: string } };
};

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => Evidence)
@UseGuards(JwtAuthGuard)
export class EvidenceResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [Evidence], {
    description:
      'List evidence visible to the current user (via document ownership).',
  })
  async evidence(@Context() ctx?: GqlContext) {
    const userId = ctx?.req?.user?.sub;
    if (!userId) return [];

    return this.prisma.evidence.findMany({
      where: {
        sourceDocument: { userId },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  @Query(() => Evidence, { nullable: true })
  async evidenceById(@Args('id') id: string) {
    return this.prisma.evidence.findUnique({ where: { id } });
  }

  @ResolveField(() => User)
  async createdByUser(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { createdBy: string };
    return this.prisma.user.findUniqueOrThrow({ where: { id: e.createdBy } });
  }

  @ResolveField(() => Document, { nullable: true })
  async sourceDocument(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { sourceDocumentId: string | null };
    if (!e.sourceDocumentId) return null;
    return this.prisma.document.findUnique({
      where: { id: e.sourceDocumentId },
    });
  }

  @ResolveField(() => DocumentChunk, { nullable: true })
  async chunk(@Parent() evidence: Evidence) {
    const e = evidence as unknown as { chunkId: string | null };
    if (!e.chunkId) return null;
    return this.prisma.documentChunk.findUnique({ where: { id: e.chunkId } });
  }

  /**
   * Create Evidence (ADR-019). Immutable after creation.
   * Fail-fast: rejects missing source, missing locator, malformed offsets.
   */
  @Mutation(() => Evidence)
  async createEvidence(
    @Args('input') input: CreateEvidenceInput,
    @Context() ctx?: GqlContext,
  ) {
    const userId = ctx?.req?.user?.sub;
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

    // 2. Locator validation (for DOCUMENT)
    if (sourceType === CreateEvidenceSourceKindInput.DOCUMENT) {
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
      if (!chunk)
        throw contractError(GQL_ERROR_CODES.EVIDENCE_SOURCE_NOT_FOUND);
      if (chunk.documentId !== sourceDocumentId!) {
        throw contractError(GQL_ERROR_CODES.EVIDENCE_CHUNK_NOT_IN_SOURCE);
      }
      if (startOffset < 0 || endOffset > chunk.content.length) {
        throw contractError(GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS);
      }

      // Validate snippet against content when provided
      if (snippet != null && snippet !== '') {
        const span = extractSpan(chunk.content, startOffset, endOffset);
        if (snippet !== span) {
          throw contractError(GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS);
        }
      }
    }

    const evidence = await this.prisma.evidence.create({
      data: {
        sourceType: sourceType as unknown as EvidenceSourceKind,
        sourceDocumentId: sourceDocumentId ?? undefined,
        sourceUrl: sourceUrl ?? undefined,
        chunkId: chunkId ?? undefined,
        startOffset: startOffset ?? undefined,
        endOffset: endOffset ?? undefined,
        snippet: snippet ?? undefined,
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
  @Mutation(() => Evidence)
  async linkEvidenceToClaim(
    @Args('evidenceId') evidenceId: string,
    @Args('claimId') claimId: string,
    @Context() ctx?: GqlContext,
  ) {
    const userId = ctx?.req?.user?.sub;
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const ev = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { sourceDocument: { select: { userId: true } } },
    });
    if (!ev) throw contractError(GQL_ERROR_CODES.EVIDENCE_NOT_FOUND);
    if (ev.sourceDocument?.userId !== userId) {
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
