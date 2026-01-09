import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity } from './entity.model';
import { DocumentChunk } from './document-chunk.model';

@ObjectType()
export class EntityMention {
  @Field(() => ID)
  id!: string;

  @Field(() => Entity)
  entity!: Entity;

  @Field(() => DocumentChunk)
  chunk!: DocumentChunk;
}
