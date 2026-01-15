import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Entity } from './entity.model';
import { DocumentChunk } from './document-chunk.model';

@ObjectType()
export class EntityMention {
  @Field(() => ID)
  id!: string;

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

  @Field({
    nullable: true,
    description:
      'Optional captured mention text at creation time (best-effort). When present with offsets, the backend validates consistency.',
  })
  spanText?: string | null;

  @Field(() => Float, {
    nullable: true,
    description:
      'Optional extraction confidence as metadata (nullable; not a truth indicator).',
  })
  confidence?: number | null;

  @Field(() => Entity)
  entity!: Entity;

  @Field(() => DocumentChunk)
  chunk!: DocumentChunk;
}
