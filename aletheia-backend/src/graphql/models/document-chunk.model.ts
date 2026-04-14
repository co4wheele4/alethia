// src/graphql/models/document-chunk.model.ts
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DocumentChunk {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  chunkIndex!: number;

  @Field()
  content!: string;

  @Field(() => String)
  documentId?: string;
}
