import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ReviewerResponse } from './reviewer-response.model';

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

  /**
   * Optional response from the assigned reviewer (ADR-016).
   *
   * Epistemic contract:
   * - Coordination-only: does not determine truth or claim status.
   * - MUST NOT be treated as authority/endorsement.
   */
  @Field(() => ReviewerResponse, { nullable: true })
  reviewerResponse?: ReviewerResponse | null;
}
