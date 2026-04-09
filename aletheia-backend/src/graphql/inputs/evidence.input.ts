import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/** Input enum for evidence creation (matches EvidenceSourceKind). */
export enum CreateEvidenceSourceKindInput {
  DOCUMENT = 'DOCUMENT',
  URL = 'URL',
}

registerEnumType(CreateEvidenceSourceKindInput, {
  name: 'CreateEvidenceSourceKindInput',
});

/**
 * Input for creating Evidence (ADR-019).
 * Fail-fast validation: missing source, missing locator, malformed offsets → reject.
 */
@InputType()
export class CreateEvidenceInput {
  @Field(() => CreateEvidenceSourceKindInput)
  @IsNotEmpty()
  sourceType!: CreateEvidenceSourceKindInput;

  /** Required when sourceType=DOCUMENT. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  sourceDocumentId?: string;

  /** Required when sourceType=URL. Not yet implemented. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  /** Required when sourceType=DOCUMENT. Chunk must belong to sourceDocumentId. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  chunkId?: string;

  /** Required when sourceType=DOCUMENT. 0-based inclusive start. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  startOffset?: number;

  /** Required when sourceType=DOCUMENT. 0-based exclusive end. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  endOffset?: number;

  /**
   * Verbatim span text (ADR-024). Required for DOCUMENT: must exactly equal the chunk slice at [startOffset, endOffset).
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  snippet?: string;

  /** Claim IDs to link this evidence to (optional; can link later). */
  @Field(() => [String], { nullable: true })
  @IsOptional()
  claimIds?: string[];
}
