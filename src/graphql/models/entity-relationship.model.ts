import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity } from './entity.model';

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
}
