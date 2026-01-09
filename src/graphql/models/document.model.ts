import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';
import { DocumentChunk } from './document-chunk.model';

@ObjectType()
export class Document {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => User)
  user!: User;

  @Field()
  createdAt!: Date;

  @Field(() => [DocumentChunk])
  chunks!: DocumentChunk[];
}
