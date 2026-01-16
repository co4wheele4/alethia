import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { EntityMention } from './entity-mention.model';
import { EntityRelationship } from './entity-relationship.model';

@ObjectType()
export class Entity {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  /**
   * Inspectable count only (must drill down to mentions).
   * This is intentionally just a number, not a confidence signal.
   */
  @Field(() => Int)
  mentionCount!: number;

  @Field(() => [EntityMention])
  mentions!: EntityMention[];

  @Field(() => [EntityRelationship])
  outgoing!: EntityRelationship[];

  @Field(() => [EntityRelationship])
  incoming!: EntityRelationship[];
}
