import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Document } from './document.model';
import { Evidence } from './evidence.model';

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

  /**
   * ADR-035: Set when the claim is created via `createClaim`; structural workspace scope for drafts without evidence.
   */
  @Field(() => ID, { nullable: true })
  createdByUserId?: string | null;

  @Field()
  text!: string;

  @Field(() => ClaimStatus)
  status!: ClaimStatus;

  @Field(() => Date)
  createdAt!: Date;

  /**
   * Adjudication metadata (ADR-011).
   *
   * Nullable for backward safety:
   * - existing claims may predate explicit review.
   */
  @Field(() => Date, { nullable: true })
  reviewedAt?: Date | null;

  @Field(() => ID, { nullable: true })
  reviewedBy?: string | null;

  @Field(() => String, { nullable: true })
  reviewerNote?: string | null;

  @Field(() => [Evidence], {
    description:
      'Linked evidence records (ADR-018/019). May be empty; claims without linked evidence are non-authoritative.',
  })
  evidence!: Evidence[];

  @Field(() => [Document], {
    description:
      'Documents referenced via evidence anchors; empty when the claim has no linked evidence (ADR-018).',
  })
  documents!: Document[];
}
