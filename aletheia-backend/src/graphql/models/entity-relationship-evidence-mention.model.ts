import { Field, ID, ObjectType } from '@nestjs/graphql';
import { EntityMention } from './entity-mention.model';

/**
 * Explicit join record linking an evidence anchor to one or more mention IDs.
 *
 * Epistemic contract:
 * - This is persisted linkage (no implicit m2m).
 * - It exists so clients can traverse Relationship -> Evidence -> Mention via explicit IDs.
 */
@ObjectType()
export class EntityRelationshipEvidenceMention {
  @Field(() => ID)
  evidenceId!: string;

  @Field(() => ID)
  mentionId!: string;

  @Field(() => EntityMention, {
    description: 'The referenced mention record (persisted via mentionId).',
  })
  mention!: EntityMention;
}

