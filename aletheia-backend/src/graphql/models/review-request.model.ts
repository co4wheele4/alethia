import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from './user.model';

export enum ReviewRequestSource {
  CLAIM_VIEW = 'CLAIM_VIEW',
  COMPARISON = 'COMPARISON',
}

registerEnumType(ReviewRequestSource, {
  name: 'ReviewRequestSource',
  description:
    'Origin surface for a review request (coordination-only; does not change truth or claim lifecycle).',
});

@ObjectType()
export class ReviewRequest {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  claimId!: string;

  /**
   * Internal FK (not exposed directly; requestedBy is resolved via dataloader).
   */
  requestedByUserId!: string;

  @Field(() => User)
  requestedBy!: User;

  @Field(() => Date)
  requestedAt!: Date;

  @Field(() => ReviewRequestSource)
  source!: ReviewRequestSource;

  @Field(() => String, { nullable: true })
  note?: string | null;
}
