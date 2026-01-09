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

  // embeddings is resolved via ResolveField, not as a direct field
  // @Field(() => [Float])
  // embeddings!: number[];

  @Field(() => String)
  documentId?: string;
}
