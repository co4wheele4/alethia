import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
  Int,
} from '@nestjs/graphql';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DocumentChunk } from '@models/document-chunk.model';
import { Document } from '@models/document.model';
import { EntityMention } from '@models/entity-mention.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { getGqlAuthUserId } from '../utils/gql-auth-user';

const intArgType = () => Int;
void intArgType();

type GqlRequestContext = {
  req?: {
    user?: {
      sub?: string;
      id?: string;
    };
  };
};

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => DocumentChunk)
@UseGuards(JwtAuthGuard)
export class DocumentChunkResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  private async assertOwnedDocument(
    documentId: string,
    userId: string,
  ): Promise<void> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true },
    });
    if (doc && doc.userId !== userId) {
      throw new ForbiddenException('Cannot access chunks for another user');
    }
  }

  private async getOwnedChunk(chunkId: string, userId: string) {
    return this.prisma.documentChunk.findFirst({
      where: {
        id: chunkId,
        document: { userId },
      },
    });
  }

  @Query(() => [DocumentChunk])
  async documentChunks(@Context() ctx?: GqlRequestContext) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    return await this.prisma.documentChunk.findMany({
      where: { document: { userId: authUserId } },
    });
  }

  @Query(() => DocumentChunk, { nullable: true })
  async documentChunk(
    @Args('id') id: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return null;

    return await this.prisma.documentChunk.findFirst({
      where: {
        id,
        document: { userId: authUserId },
      },
    });
  }

  @Query(() => [DocumentChunk])
  async chunksByDocument(
    @Args('documentId') documentId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    return await this.prisma.documentChunk.findMany({
      where: {
        documentId,
        document: { userId: authUserId },
      },
    });
  }

  /**
   * chunk0ByDocument
   *
   * Returns only chunkIndex=0 for a document (if present).
   * This enables provenance/source-type display without downloading all chunks.
   */
  @Query(() => DocumentChunk, { nullable: true })
  async chunk0ByDocument(
    @Args('documentId') documentId: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return null;

    return await this.prisma.documentChunk.findFirst({
      where: {
        documentId,
        chunkIndex: 0,
        document: { userId: authUserId },
      },
    });
  }

  @Mutation(() => DocumentChunk)
  async createChunk(
    @Args('documentId') documentId: string,
    @Args('chunkIndex', { type: intArgType }) chunkIndex: number,
    @Args('content') content: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) {
      throw new ForbiddenException('Authentication required');
    }
    await this.assertOwnedDocument(documentId, authUserId);

    return await this.prisma.documentChunk.create({
      data: { documentId, chunkIndex, content },
    });
  }

  @Mutation(() => DocumentChunk)
  async updateChunk(
    @Args('id') id: string,
    @Args('content', { nullable: true }) content?: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) {
      throw new ForbiddenException('Authentication required');
    }

    const current = await this.getOwnedChunk(id, authUserId);
    if (!current) {
      throw new NotFoundException(`Document chunk not found: ${id}`);
    }
    const contentChanges = content !== undefined && content !== current.content;
    if (contentChanges) {
      await this.assertChunkTextNotAnchored(id);
    }
    return await this.prisma.documentChunk.update({
      where: { id },
      data: { content },
    });
  }

  @Mutation(() => DocumentChunk)
  async deleteChunk(
    @Args('id') id: string,
    @Context() ctx?: GqlRequestContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) {
      throw new ForbiddenException('Authentication required');
    }

    const current = await this.getOwnedChunk(id, authUserId);
    if (!current) {
      throw new NotFoundException(`Document chunk not found: ${id}`);
    }

    await this.assertChunkDeletable(id);
    return await this.prisma.documentChunk.delete({ where: { id } });
  }

  /**
   * Chunk text must not change while evidence spans, entity mentions, relationship-evidence
   * anchors, or embeddings reference the chunk (ADR-019 traceability; offsets/snippets).
   */
  private async assertChunkTextNotAnchored(chunkId: string): Promise<void> {
    const [evidenceN, mentionN, relEvN, embeddingN] = await Promise.all([
      this.prisma.evidence.count({ where: { chunkId } }),
      this.prisma.entityMention.count({ where: { chunkId } }),
      this.prisma.entityRelationshipEvidence.count({ where: { chunkId } }),
      this.prisma.embedding.count({ where: { chunkId } }),
    ]);
    const blocked = evidenceN + mentionN + relEvN + embeddingN;
    if (blocked > 0) {
      throw new BadRequestException(
        `Cannot change chunk text: ${evidenceN} evidence row(s), ${mentionN} entity mention(s), ${relEvN} relationship-evidence anchor(s), ${embeddingN} embedding row(s) reference this chunk. Remove or re-anchor dependents first.`,
      );
    }
  }

  private async assertChunkDeletable(chunkId: string): Promise<void> {
    const [evidenceN, mentionN, relEvN, embeddingN] = await Promise.all([
      this.prisma.evidence.count({ where: { chunkId } }),
      this.prisma.entityMention.count({ where: { chunkId } }),
      this.prisma.entityRelationshipEvidence.count({ where: { chunkId } }),
      this.prisma.embedding.count({ where: { chunkId } }),
    ]);
    const blocked = evidenceN + mentionN + relEvN + embeddingN;
    if (blocked > 0) {
      throw new BadRequestException(
        `Cannot delete chunk: ${evidenceN} evidence row(s), ${mentionN} entity mention(s), ${relEvN} relationship-evidence anchor(s), ${embeddingN} embedding row(s) reference this chunk.`,
      );
    }
  }

  @ResolveField(() => Document)
  async document(@Parent() chunk: DocumentChunk) {
    const chunkWithDocumentId = chunk as unknown as { documentId: string };
    return this.dataLoaders
      .getDocumentLoader()
      .load(chunkWithDocumentId.documentId);
  }

  @ResolveField(() => [EntityMention])
  async mentions(@Parent() chunk: DocumentChunk) {
    return this.dataLoaders.getMentionsByChunkLoader().load(chunk.id);
  }
}
