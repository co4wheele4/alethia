import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class AiQuery {
  @Field(() => ID)
  id!: string;

  @Field()
  query!: string;

  @Field(() => User)
  user!: User;

  @Field()
  createdAt!: Date;
}

/**
 * ADR-022: No derived-semantic fields (score, confidence, rank, etc.).
 * The Prisma model may retain score for internal use; it is not exposed via GraphQL.
 */
@ObjectType()
export class AiQueryResult {
  @Field(() => ID)
  id!: string;

  @Field()
  answer!: string;

  @Field(() => AiQuery)
  query!: AiQuery;
}
