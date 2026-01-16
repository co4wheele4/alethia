import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Entity } from './entity.model';
import { DocumentChunk } from './document-chunk.model';

@ObjectType()
export class EntityMention {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, {
    description:
      'Explicit foreign key to the mentioned entity (persisted; enables ID-first traversal).',
  })
  entityId!: string;

  @Field(() => ID, {
    description:
      'Explicit foreign key to the chunk where this mention occurred (persisted; enables ID-first traversal).',
  })
  chunkId!: string;

  @Field(() => Int, {
    nullable: true,
    description:
      '0-based inclusive start offset into chunk content. Nullable for legacy mentions created without spans.',
  })
  startOffset?: number | null;

  @Field(() => Int, {
    nullable: true,
    description:
      '0-based exclusive end offset into chunk content. Nullable for legacy mentions created without spans.',
  })
  endOffset?: number | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Optional captured mention text at creation time (best-effort). When present with offsets, the backend validates consistency.',
  })
  excerpt?: string | null;

  @Field(() => Entity)
  entity!: Entity;

  @Field(() => DocumentChunk)
  chunk!: DocumentChunk;
}
