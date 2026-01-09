import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { DocumentChunk } from './document-chunk.model';

@ObjectType()
export class Embedding {
  @Field(() => ID)
  id!: string;

  @Field(() => [Float])
  values!: number[];

  @Field(() => DocumentChunk)
  chunk!: DocumentChunk;
}
