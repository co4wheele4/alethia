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
