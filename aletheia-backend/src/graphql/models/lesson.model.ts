import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class Lesson {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => User)
  user!: User;

  @Field()
  createdAt!: Date;
}
