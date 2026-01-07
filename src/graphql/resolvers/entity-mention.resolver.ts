import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { PrismaService } from '@prisma/prisma.service';
import { EntityMention } from '@models/entity-mention.model';
import { Entity } from '@models/entity.model';
import { DocumentChunk } from '@models/document-chunk.model';
import {
  CreateEntityMentionInput,
  UpdateEntityMentionInput,
} from '@inputs/entity-mention.input';

@Resolver(() => EntityMention)
export class EntityMentionResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [EntityMention])
  async entityMentions() {
    return this.prisma.entityMention.findMany();
  }

  @Query(() => EntityMention, { nullable: true })
  async entityMention(@Args('id') id: string) {
    return this.prisma.entityMention.findUnique({ where: { id } });
  }

  @ResolveField(() => Entity)
  async entity(@Parent() mention: EntityMention) {
    // Access entityId from the database field, not the GraphQL field
    const mentionWithEntityId = mention as unknown as { entityId: string };
    return this.prisma.entity.findUnique({ where: { id: mentionWithEntityId.entityId } });
  }

  @ResolveField(() => DocumentChunk)
  async chunk(@Parent() mention: EntityMention) {
    // Access chunkId from the database field, not the GraphQL field
    const mentionWithChunkId = mention as unknown as { chunkId: string };
    return this.prisma.documentChunk.findUnique({
      where: { id: mentionWithChunkId.chunkId },
    });
  }

  // ------------------
  // Mutations
  // ------------------

  @Mutation(() => EntityMention)
  async createEntityMention(@Args('data') data: CreateEntityMentionInput) {
    return this.prisma.entityMention.create({ data });
  }

  @Mutation(() => EntityMention)
  async updateEntityMention(@Args('data') data: UpdateEntityMentionInput) {
    const { id, entityId, chunkId } = data;
    return this.prisma.entityMention.update({
      where: { id },
      data: { entityId, chunkId },
    });
  }

  @Mutation(() => EntityMention)
  async deleteEntityMention(@Args('id') id: string) {
    return this.prisma.entityMention.delete({ where: { id } });
  }
}
