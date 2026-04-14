import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReviewQuorumStatus {
  @Field()
  enabled!: boolean;

  @Field(() => Int)
  requiredCount!: number;

  @Field(() => Int)
  acknowledgedCount!: number;
}
