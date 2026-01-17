// src/graphql/models/document-chunk.model.ts
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { AiExtractionSuggestion } from './ai-extraction-suggestion.model';

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

  @Field(() => [AiExtractionSuggestion], { nullable: true })
  aiSuggestions?: AiExtractionSuggestion[];
}
