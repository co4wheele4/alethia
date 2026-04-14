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
import { ClaimStatus } from '@models/claim.model';
import { EvidenceSourceKind } from '@models/evidence.model';
import { ADR033_MAX_SEARCH_LIMIT } from '@common/search/prisma-string-filter';
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
  @IsOptional()
  @IsEnum(ClaimStatus)
  lifecycle?: ClaimStatus;

  @Field(() => EvidenceSourceKind, {
    nullable: true,
    description:
      'Require at least one linked evidence row with this source kind (structural).',
  })
  @IsOptional()
  @IsEnum(EvidenceSourceKind)
  evidenceSourceType?: EvidenceSourceKind;

  @Field(() => Date, {
    nullable: true,
    description: 'Claim createdAt >= this instant (optional).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtAfter?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Claim createdAt <= this instant (optional).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtBefore?: Date;
}

@InputType()
export class SearchClaimsInput {
  @Field(() => String, {
    description:
      'Text to match against claim text. Empty string applies no text predicate (filters only).',
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

  @Field(() => SearchClaimsFiltersInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchClaimsFiltersInput)
  filters?: SearchClaimsFiltersInput;

  @Field(() => DeterministicOrderBy)
  @IsEnum(DeterministicOrderBy)
  orderBy!: DeterministicOrderBy;

  @Field(() => Int, {
    description: 'Page size (required; capped server-side).',
  })
  @IsInt()
  @Min(1)
  @Max(ADR033_MAX_SEARCH_LIMIT)
  limit!: number;

  @Field(() => Int, {
    description: 'Offset into the deterministic result set (required).',
  })
  @IsInt()
  @Min(0)
  offset!: number;
}
