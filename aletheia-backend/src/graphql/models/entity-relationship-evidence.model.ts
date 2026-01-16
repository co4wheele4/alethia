import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DocumentChunk } from './document-chunk.model';
import { EntityRelationshipEvidenceMention } from './entity-relationship-evidence-mention.model';

export enum RelationshipEvidenceKind {
  TEXT_SPAN = 'TEXT_SPAN',
}

registerEnumType(RelationshipEvidenceKind, {
  name: 'RelationshipEvidenceKind',
  description:
    'Evidence kind for an entity relationship (currently only TEXT_SPAN).',
});

@ObjectType()
export class EntityRelationshipEvidence {
  @Field(() => ID)
  id!: string;

  @Field()
  relationshipId!: string;

  @Field()
  chunkId!: string;

  @Field(() => RelationshipEvidenceKind)
  kind!: RelationshipEvidenceKind;

  @Field(() => Int, {
    nullable: true,
    description: '0-based, inclusive start offset into chunk content.',
  })
  startOffset?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: '0-based, exclusive end offset into chunk content.',
  })
  endOffset?: number | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Optional captured quote text (best-effort), validated against offsets when provided.',
  })
  quotedText?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => DocumentChunk)
  chunk!: DocumentChunk;

  @Field(() => [EntityRelationshipEvidenceMention], {
    description:
      'Explicit persisted links from this evidence anchor to concrete mention IDs (may be empty for legacy evidence).',
  })
  mentionLinks!: EntityRelationshipEvidenceMention[];
}
