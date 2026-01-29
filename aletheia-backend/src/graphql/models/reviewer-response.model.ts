import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Reviewer response semantics (ADR-016).
 *
 * Epistemic contract:
 * - Coordination-only: acknowledges/declines attention.
 * - MUST NOT imply authority, endorsement, correctness, or lifecycle change.
 * - MUST NOT mutate Claim.status, adjudication metadata, or evidence.
 */
export enum ReviewerResponseType {
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DECLINED = 'DECLINED',
}

registerEnumType(ReviewerResponseType, {
  name: 'ReviewerResponseType',
  description:
    'Coordination-only reviewer response (ACKNOWLEDGED = seen; DECLINED = cannot take). Does not determine truth or claim status.',
});

@ObjectType()
export class ReviewerResponse {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  reviewAssignmentId!: string;

  @Field(() => ID)
  reviewerUserId!: string;

  @Field(() => ReviewerResponseType)
  response!: ReviewerResponseType;

  @Field(() => Date)
  respondedAt!: Date;

  @Field(() => String, { nullable: true })
  note?: string | null;
}
