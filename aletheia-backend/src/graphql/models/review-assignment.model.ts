import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * Reviewer assignment (ADR-015).
 *
 * Epistemic contract:
 * - Coordination metadata only.
 * - MUST NOT imply authority, responsibility, or correctness.
 * - MUST NOT mutate Claim.status or invoke adjudication.
 */
@ObjectType()
export class ReviewAssignment {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  reviewRequestId!: string;

  @Field(() => ID)
  reviewerUserId!: string;

  @Field(() => ID)
  assignedByUserId!: string;

  @Field(() => Date)
  assignedAt!: Date;
}
