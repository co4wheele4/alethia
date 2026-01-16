import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DocumentChunk } from '@models/document-chunk.model';
import { Document } from '@models/document.model';
import { Embedding } from '@models/embedding.model';
import { EntityMention } from '@models/entity-mention.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => DocumentChunk)
@UseGuards(JwtAuthGuard)
export class DocumentChunkResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [DocumentChunk])
  async documentChunks() {
    return await this.prisma.documentChunk.findMany();
  }

  @Query(() => DocumentChunk, { nullable: true })
  async documentChunk(@Args('id') id: string) {
    return await this.prisma.documentChunk.findUnique({ where: { id } });
  }

  @Query(() => [DocumentChunk])
  async chunksByDocument(@Args('documentId') documentId: string) {
    return await this.prisma.documentChunk.findMany({ where: { documentId } });
  }

  /**
   * chunk0ByDocument
   *
   * Returns only chunkIndex=0 for a document (if present).
   * This enables provenance/source-type display without downloading all chunks.
   */
  @Query(() => DocumentChunk, { nullable: true })
  async chunk0ByDocument(@Args('documentId') documentId: string) {
    return await this.prisma.documentChunk.findFirst({
      where: { documentId, chunkIndex: 0 },
    });
  }

  @Mutation(() => DocumentChunk)
  async createChunk(
    @Args('documentId') documentId: string,
    @Args('chunkIndex', { type: () => Int }) chunkIndex: number,
    @Args('content') content: string,
  ) {
    return await this.prisma.documentChunk.create({
      data: { documentId, chunkIndex, content },
    });
  }

  @Mutation(() => DocumentChunk)
  async updateChunk(
    @Args('id') id: string,
    @Args('content', { nullable: true }) content?: string,
  ) {
    return await this.prisma.documentChunk.update({
      where: { id },
      data: { content },
    });
  }

  @Mutation(() => DocumentChunk)
  async deleteChunk(@Args('id') id: string) {
    return await this.prisma.documentChunk.delete({ where: { id } });
  }

  @ResolveField(() => Document)
  async document(@Parent() chunk: DocumentChunk) {
    const chunkWithDocumentId = chunk as unknown as { documentId: string };
    return this.dataLoaders
      .getDocumentLoader()
      .load(chunkWithDocumentId.documentId);
  }

  @ResolveField(() => [Embedding])
  async embeddings(@Parent() chunk: DocumentChunk) {
    return this.dataLoaders.getEmbeddingsByChunkLoader().load(chunk.id);
  }

  @ResolveField(() => [EntityMention])
  async mentions(@Parent() chunk: DocumentChunk) {
    return this.dataLoaders.getMentionsByChunkLoader().load(chunk.id);
  }
}
