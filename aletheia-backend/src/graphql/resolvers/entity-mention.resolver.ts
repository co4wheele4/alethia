import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { BadRequestException, UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { EntityMention } from '@models/entity-mention.model';
import { Entity } from '@models/entity.model';
import { DocumentChunk } from '@models/document-chunk.model';
import {
  CreateEntityMentionInput,
  UpdateEntityMentionInput,
} from '@inputs/entity-mention.input';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => EntityMention)
@UseGuards(JwtAuthGuard)
export class EntityMentionResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [EntityMention])
  async entityMentions() {
    return await this.prisma.entityMention.findMany();
  }

  @Query(() => EntityMention, { nullable: true })
  async entityMention(@Args('id') id: string) {
    return await this.prisma.entityMention.findUnique({ where: { id } });
  }

  @ResolveField(() => Entity)
  async entity(@Parent() mention: EntityMention) {
    // Access entityId from the database field, not the GraphQL field
    const mentionWithEntityId = mention as unknown as { entityId: string };
    return this.dataLoaders
      .getEntityLoader()
      .load(mentionWithEntityId.entityId);
  }

  @ResolveField(() => DocumentChunk)
  async chunk(@Parent() mention: EntityMention) {
    // Access chunkId from the database field, not the GraphQL field
    const mentionWithChunkId = mention as unknown as { chunkId: string };
    return this.dataLoaders
      .getDocumentChunkLoader()
      .load(mentionWithChunkId.chunkId);
  }

  // ------------------
  // Mutations
  // ------------------

  @Mutation(() => EntityMention)
  async createEntityMention(@Args('data') data: CreateEntityMentionInput) {
    const {
      entityId,
      chunkId,
      startOffset,
      endOffset,
      spanText,
      confidence,
    } = data;

    const hasStart = typeof startOffset === 'number';
    const hasEnd = typeof endOffset === 'number';
    if (hasStart !== hasEnd) {
      throw new BadRequestException(
        'startOffset and endOffset must be provided together (or both omitted).',
      );
    }

    if (typeof confidence === 'number' && (confidence < 0 || confidence > 1)) {
      throw new BadRequestException('confidence must be between 0 and 1.');
    }

    let validatedSpanText: string | null = spanText ?? null;
    if (!hasStart && validatedSpanText !== null) {
      throw new BadRequestException(
        'spanText requires startOffset/endOffset so it can be validated against chunk content.',
      );
    }

    if (hasStart && hasEnd) {
      if (endOffset! <= startOffset!) {
        throw new BadRequestException('endOffset must be greater than startOffset.');
      }

      const chunk = await this.prisma.documentChunk.findUnique({
        where: { id: chunkId },
        select: { content: true },
      });
      if (!chunk) {
        throw new BadRequestException('Chunk not found.');
      }

      const content = chunk.content ?? '';
      if (startOffset! < 0 || endOffset! > content.length) {
        throw new BadRequestException(
          `Span offsets are out of bounds for chunk content (length=${content.length}).`,
        );
      }

      const exact = content.slice(startOffset!, endOffset!);
      if (validatedSpanText !== null && validatedSpanText !== exact) {
        throw new BadRequestException(
          'spanText does not match the chunk content at the provided offsets.',
        );
      }

      // Best-effort capture of exact span text for auditability.
      validatedSpanText = exact;
    }

    const createData: {
      entityId: string;
      chunkId: string;
      startOffset?: number;
      endOffset?: number;
      spanText?: string | null;
      confidence?: number;
    } = { entityId, chunkId };

    if (hasStart && hasEnd) {
      createData.startOffset = startOffset!;
      createData.endOffset = endOffset!;
      createData.spanText = validatedSpanText;
    }
    if (typeof confidence === 'number') {
      createData.confidence = confidence;
    }

    return await this.prisma.entityMention.create({
      data: createData,
    });
  }

  @Mutation(() => EntityMention)
  async updateEntityMention(@Args('data') data: UpdateEntityMentionInput) {
    const { id, entityId, chunkId } = data;
    return await this.prisma.entityMention.update({
      where: { id },
      data: { entityId, chunkId },
    });
  }

  @Mutation(() => EntityMention)
  async deleteEntityMention(@Args('id') id: string) {
    return await this.prisma.entityMention.delete({ where: { id } });
  }
}
