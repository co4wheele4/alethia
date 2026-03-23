import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Source kind for Evidence (ADR-019).
 */
export enum EvidenceSourceKind {
  DOCUMENT = 'DOCUMENT',
  URL = 'URL',
}

registerEnumType(EvidenceSourceKind, {
  name: 'EvidenceSourceKind',
  description:
    'Source type for evidence. DOCUMENT = ingested document; URL = external (future).',
});

/**
 * Evidence: reference to source material enabling inspection of a claim.
 *
 * ADR-019 invariants:
 * - Referentially valid (source exists, locator reproducible)
 * - Immutable after creation (no update mutation)
 * - No confidence, scoring, or inference
 * - Reusable across claims (via ClaimEvidenceLink)
 */
@ObjectType()
export class Evidence {
  @Field(() => ID)
  id!: string;

  @Field()
  createdAt!: Date;

  @Field(() => ID)
  createdBy!: string;

  @Field(() => EvidenceSourceKind)
  sourceType!: EvidenceSourceKind;

  @Field(() => ID, { nullable: true })
  sourceDocumentId?: string | null;

  @Field(() => String, { nullable: true })
  sourceUrl?: string | null;

  @Field(() => ID, { nullable: true })
  chunkId?: string | null;

  @Field(() => Int, { nullable: true })
  startOffset?: number | null;

  @Field(() => Int, { nullable: true })
  endOffset?: number | null;

  /** Optional verbatim snippet (not derived or summarized). */
  @Field(() => String, { nullable: true })
  snippet?: string | null;
}
