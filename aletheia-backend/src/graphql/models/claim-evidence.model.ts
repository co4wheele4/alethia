import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * ClaimEvidence
 *
 * An explicit grounding anchor that links a Claim to concrete evidence identifiers.
 *
 * Epistemic contract:
 * - No confidence/probability/scoring fields.
 * - Always references a documentId.
 * - References mentionIds and/or relationshipIds (explicit persisted linkage).
 */
@ObjectType()
export class ClaimEvidence {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  claimId!: string;

  @Field(() => ID)
  documentId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => [ID], {
    description:
      'Explicit persisted mention IDs grounding this claim evidence (may be empty if relationshipIds are present).',
  })
  mentionIds!: string[];

  @Field(() => [ID], {
    description:
      'Explicit persisted relationship IDs grounding this claim evidence (may be empty if mentionIds are present).',
  })
  relationshipIds!: string[];
}
