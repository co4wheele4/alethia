import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Document } from './document.model';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  createdAt!: Date;

  @Field(() => [Document])
  documents!: Document[];
}
