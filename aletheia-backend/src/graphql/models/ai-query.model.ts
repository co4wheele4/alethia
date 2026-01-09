import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
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

@ObjectType()
export class AiQueryResult {
  @Field(() => ID)
  id!: string;

  @Field()
  answer!: string;

  @Field(() => Float)
  score!: number;

  @Field(() => AiQuery)
  query!: AiQuery;
}
