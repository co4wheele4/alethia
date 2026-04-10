import { Field, InputType, Int } from '@nestjs/graphql';
import { ClaimStatus } from '@models/claim.model';
import { EvidenceSourceKind } from '@models/evidence.model';
import {
  DeterministicOrderBy,
  TextMatchMode,
} from '../enums/search-text-match.enum';

@InputType()
export class SearchClaimsFiltersInput {
  @Field(() => ClaimStatus, {
    nullable: true,
    description: 'Filter by claim lifecycle (optional).',
  })
  lifecycle?: ClaimStatus;

  @Field(() => EvidenceSourceKind, {
    nullable: true,
    description:
      'Require at least one linked evidence row with this source kind (structural).',
  })
  evidenceSourceType?: EvidenceSourceKind;

  @Field(() => Date, {
    nullable: true,
    description: 'Claim createdAt >= this instant (optional).',
  })
  createdAtAfter?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Claim createdAt <= this instant (optional).',
  })
  createdAtBefore?: Date;
}

@InputType()
export class SearchClaimsInput {
  @Field(() => String, {
    description:
      'Text to match against claim text. Empty string applies no text predicate (filters only).',
  })
  queryText!: string;

  @Field(() => TextMatchMode)
  matchMode!: TextMatchMode;

  @Field(() => Boolean, {
    description:
      'If true, matching is case-sensitive; if false, case-insensitive.',
  })
  caseSensitive!: boolean;

  @Field(() => SearchClaimsFiltersInput, { nullable: true })
  filters?: SearchClaimsFiltersInput;

  @Field(() => DeterministicOrderBy)
  orderBy!: DeterministicOrderBy;

  @Field(() => Int, {
    description: 'Page size (required; capped server-side).',
  })
  limit!: number;

  @Field(() => Int, {
    description: 'Offset into the deterministic result set (required).',
  })
  offset!: number;
}
