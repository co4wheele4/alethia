import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ADR033_MAX_SEARCH_LIMIT } from '@common/search/prisma-string-filter';
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
  @IsOptional()
  @IsEnum(EvidenceSourceKind)
  sourceType?: EvidenceSourceKind;

  @Field(() => Date, {
    nullable: true,
    description: 'Evidence createdAt >= this instant (optional).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtAfter?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Evidence createdAt <= this instant (optional).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtBefore?: Date;
}

@InputType()
export class SearchEvidenceInput {
  @Field(() => String, {
    description:
      'Text to match against evidence snippet and sourceUrl. Empty string applies no text predicate.',
  })
  @IsString()
  queryText!: string;

  @Field(() => TextMatchMode)
  @IsEnum(TextMatchMode)
  matchMode!: TextMatchMode;

  @Field(() => Boolean, {
    description:
      'If true, matching is case-sensitive; if false, case-insensitive.',
  })
  @IsBoolean()
  caseSensitive!: boolean;

  @Field(() => SearchEvidenceFiltersInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchEvidenceFiltersInput)
  filters?: SearchEvidenceFiltersInput;

  @Field(() => DeterministicOrderBy)
  @IsEnum(DeterministicOrderBy)
  orderBy!: DeterministicOrderBy;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(ADR033_MAX_SEARCH_LIMIT)
  limit!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  offset!: number;
}
