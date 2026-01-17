import { Field, ID, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { SuggestionStatus, SuggestionKind } from '@prisma/client';

registerEnumType(SuggestionStatus, {
  name: 'SuggestionStatus',
});

registerEnumType(SuggestionKind, {
  name: 'SuggestionKind',
});

@ObjectType()
export class AiExtractionSuggestion {
  @Field(() => ID)
  id!: string;

  @Field()
  chunkId!: string;

  @Field(() => SuggestionKind)
  kind!: SuggestionKind;

  @Field(() => SuggestionStatus)
  status!: SuggestionStatus;

  @Field({ nullable: true })
  entityName?: string;

  @Field({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  subjectName?: string;

  @Field({ nullable: true })
  subjectType?: string;

  @Field({ nullable: true })
  objectName?: string;

  @Field({ nullable: true })
  objectType?: string;

  @Field({ nullable: true })
  relation?: string;

  @Field(() => Int, { nullable: true })
  startOffset?: number;

  @Field(() => Int, { nullable: true })
  endOffset?: number;

  @Field({ nullable: true })
  excerpt?: string;

  @Field()
  createdAt!: Date;
}
