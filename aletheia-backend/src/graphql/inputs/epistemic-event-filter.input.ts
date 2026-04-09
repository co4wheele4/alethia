import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class EpistemicEventFilterInput {
  @Field({ nullable: true })
  createdAfter?: Date;

  @Field({ nullable: true })
  createdBefore?: Date;

  @Field({ nullable: true })
  errorCode?: string;
}
