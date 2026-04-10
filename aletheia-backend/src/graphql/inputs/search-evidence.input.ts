import { Field, InputType, Int } from '@nestjs/graphql';
import { EvidenceSourceKind } from '@models/evidence.model';
import {
  DeterministicOrderBy,
  TextMatchMode,
} from '../enums/search-text-match.enum';

@InputType()
export class SearchEvidenceFiltersInput {
  @Field(() => EvidenceSourceKind, {
    nullable: true,
    description: 'Filter by evidence source kind (optional).',
  })
  sourceType?: EvidenceSourceKind;

  @Field(() => Date, {
    nullable: true,
    description: 'Evidence createdAt >= this instant (optional).',
  })
  createdAtAfter?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Evidence createdAt <= this instant (optional).',
  })
  createdAtBefore?: Date;
}

@InputType()
export class SearchEvidenceInput {
  @Field(() => String, {
    description:
      'Text to match against evidence snippet and sourceUrl. Empty string applies no text predicate.',
  })
  queryText!: string;

  @Field(() => TextMatchMode)
  matchMode!: TextMatchMode;

  @Field(() => Boolean, {
    description:
      'If true, matching is case-sensitive; if false, case-insensitive.',
  })
  caseSensitive!: boolean;

  @Field(() => SearchEvidenceFiltersInput, { nullable: true })
  filters?: SearchEvidenceFiltersInput;

  @Field(() => DeterministicOrderBy)
  orderBy!: DeterministicOrderBy;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  offset!: number;
}
