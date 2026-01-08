import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Embedding } from '@models/embedding.model';
import { DocumentChunk } from '@models/document-chunk.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => Embedding)
@UseGuards(JwtAuthGuard)
export class EmbeddingResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [Embedding])
  async embeddings() {
    return this.prisma.embedding.findMany();
  }

  @Query(() => Embedding, { nullable: true })
  async embedding(@Args('id') id: string) {
    return this.prisma.embedding.findUnique({ where: { id } });
  }

  @Query(() => [Embedding])
  async embeddingsByChunk(@Args('chunkId') chunkId: string) {
    return this.prisma.embedding.findMany({ where: { chunkId } });
  }

  @Mutation(() => Embedding)
  async createEmbedding(
    @Args('chunkId') chunkId: string,
    @Args({ name: 'values', type: () => [Number] }) values: number[],
  ) {
    return this.prisma.embedding.create({ data: { chunkId, values } });
  }

  @Mutation(() => Embedding)
  async updateEmbedding(
    @Args('id') id: string,
    @Args({ name: 'values', type: () => [Number], nullable: true })
    values?: number[],
  ) {
    return this.prisma.embedding.update({ where: { id }, data: { values } });
  }

  @Mutation(() => Embedding)
  async deleteEmbedding(@Args('id') id: string) {
    return this.prisma.embedding.delete({ where: { id } });
  }

  @ResolveField(() => DocumentChunk)
  async chunk(@Parent() embedding: Embedding) {
    // Access chunkId from the database field, not the GraphQL field
    const embeddingWithChunkId = embedding as unknown as { chunkId: string };
    return this.dataLoaders.getDocumentChunkLoader().load(embeddingWithChunkId.chunkId);
  }
}
