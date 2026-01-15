import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity } from './entity.model';
import { EntityRelationshipEvidence } from './entity-relationship-evidence.model';

@ObjectType()
export class EntityRelationship {
  @Field(() => ID)
  id!: string;

  @Field()
  relation!: string;

  @Field(() => Entity)
  from!: Entity;

  @Field(() => Entity)
  to!: Entity;

  @Field(() => [EntityRelationshipEvidence], {
    description:
      'Inspectable evidence anchors supporting this relationship. May be empty for legacy relationships.',
  })
  evidence!: EntityRelationshipEvidence[];
}
