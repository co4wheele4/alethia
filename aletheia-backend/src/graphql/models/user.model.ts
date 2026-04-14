import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Lesson } from './lesson.model';
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

  @Field(() => [Lesson])
  lessons!: Lesson[];

  @Field(() => [Document])
  documents!: Document[];
}
