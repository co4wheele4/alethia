import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Document } from './document.model';
import { ClaimEvidence } from './claim-evidence.model';

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

registerEnumType(ClaimStatus, {
  name: 'ClaimStatus',
  description:
    'Lifecycle state for a claim (presentation-only; does not imply truth or confidence).',
});

/**
 * CONTRACT (ADR-011): This enum exists solely to support the adjudication mutation input.
 *
 * NOTE:
 * - The persisted/returned claim state remains `ClaimStatus` (which includes `REVIEWED`).
 * - The mutation input uses `REVIEW` (not `REVIEWED`) and is mapped server-side.
 */
export enum ClaimLifecycleState {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

registerEnumType(ClaimLifecycleState, {
  name: 'ClaimLifecycleState',
  description:
    'Contract-only lifecycle input for claim adjudication (ADR-011).',
});

@ObjectType()
export class Claim {
  @Field(() => ID)
  id!: string;

  @Field()
  text!: string;

  @Field(() => ClaimStatus)
  status!: ClaimStatus;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => [ClaimEvidence], {
    description:
      'Grounding anchors for this claim. Claims must never be returned without evidence.',
  })
  evidence!: ClaimEvidence[];

  @Field(() => [Document], {
    description:
      'Documents referenced by this claim, derived from evidence.documentId.',
  })
  documents!: Document[];
}
