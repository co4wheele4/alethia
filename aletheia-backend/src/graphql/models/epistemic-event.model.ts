import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';
import { EpistemicEventType as EpistemicEventTypePrisma } from '@prisma/client';

/** Mirrors DB enum; audit-only (ADR-029). */
export enum EpistemicEventTypeGql {
  GOVERNANCE_GRAPHQL_ERROR = 'GOVERNANCE_GRAPHQL_ERROR',
}

registerEnumType(EpistemicEventTypeGql, {
  name: 'EpistemicEventType',
});

@ObjectType()
export class EpistemicEvent {
  @Field(() => ID)
  id!: string;

  @Field()
  createdAt!: Date;

  @Field(() => EpistemicEventTypeGql)
  eventType!: EpistemicEventTypeGql;

  @Field(() => String, { nullable: true })
  actorId?: string | null;

  @Field(() => String, { nullable: true })
  targetId?: string | null;

  @Field()
  errorCode!: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: unknown;
}

export function prismaEpistemicEventTypeToGql(
  t: EpistemicEventTypePrisma,
): EpistemicEventTypeGql {
  if (t === EpistemicEventTypePrisma.GOVERNANCE_GRAPHQL_ERROR)
    return EpistemicEventTypeGql.GOVERNANCE_GRAPHQL_ERROR;
  return EpistemicEventTypeGql.GOVERNANCE_GRAPHQL_ERROR;
}
