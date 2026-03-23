import { Field, InputType } from '@nestjs/graphql';
import { ClaimStatus } from '@models/claim.model';

/**
 * ADR-022: ClaimFilter supports ONLY lifecycle and hasEvidence.
 * NO counts, thresholds, or derived-semantic fields.
 */
@InputType()
export class ClaimFilterInput {
  @Field(() => ClaimStatus, {
    nullable: true,
    description: 'Filter by lifecycle state (presentation-only).',
  })
  lifecycle?: ClaimStatus;

  @Field(() => Boolean, {
    nullable: true,
    description:
      'Filter by evidence presence. true = has evidence; false = no evidence.',
  })
  hasEvidence?: boolean;
}
