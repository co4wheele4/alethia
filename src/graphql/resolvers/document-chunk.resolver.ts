import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DocumentChunk } from '@models/document-chunk.model';
import { Document } from '@models/document.model';
import { Embedding } from '@models/embedding.model';
import { EntityMention } from '@models/entity-mention.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Resolver(() => DocumentChunk)
@UseGuards(JwtAuthGuard)
export class DocumentChunkResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [DocumentChunk])
  async documentChunks() {
    return this.prisma.documentChunk.findMany();
  }

  @Query(() => DocumentChunk, { nullable: true })
  async documentChunk(@Args('id') id: string) {
    return this.prisma.documentChunk.findUnique({ where: { id } });
  }

  @Query(() => [DocumentChunk])
  async chunksByDocument(@Args('documentId') documentId: string) {
    return this.prisma.documentChunk.findMany({ where: { documentId } });
  }

  @Mutation(() => DocumentChunk)
  async createChunk(
    @Args('documentId') documentId: string,
    @Args('chunkIndex', { type: () => Int }) chunkIndex: number,
    @Args('content') content: string,
  ) {
    return this.prisma.documentChunk.create({
      data: { documentId, chunkIndex, content },
    });
  }

  @Mutation(() => DocumentChunk)
  async updateChunk(
    @Args('id') id: string,
    @Args('content', { nullable: true }) content?: string,
  ) {
    return this.prisma.documentChunk.update({
      where: { id },
      data: { content },
    });
  }

  @Mutation(() => DocumentChunk)
  async deleteChunk(@Args('id') id: string) {
    return this.prisma.documentChunk.delete({ where: { id } });
  }

  @ResolveField(() => Document)
  async document(@Parent() chunk: DocumentChunk) {
    return this.prisma.document.findUnique({ where: { id: chunk.documentId } });
  }

  @ResolveField(() => [Embedding])
  async embeddings(@Parent() chunk: DocumentChunk) {
    return this.prisma.embedding.findMany({ where: { chunkId: chunk.id } });
  }

  @ResolveField(() => [EntityMention])
  async mentions(@Parent() chunk: DocumentChunk) {
    return this.prisma.entityMention.findMany({ where: { chunkId: chunk.id } });
  }
}
