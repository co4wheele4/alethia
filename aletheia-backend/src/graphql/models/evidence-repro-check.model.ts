import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum EvidenceReproFetchStatusGql {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum EvidenceReproHashMatchGql {
  MATCH = 'MATCH',
  MISMATCH = 'MISMATCH',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(EvidenceReproFetchStatusGql, {
  name: 'EvidenceReproFetchStatus',
});

registerEnumType(EvidenceReproHashMatchGql, {
  name: 'EvidenceReproHashMatch',
});

@ObjectType()
export class EvidenceReproCheck {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  evidenceId!: string;

  @Field()
  checkedAt!: Date;

  @Field(() => EvidenceReproFetchStatusGql)
  fetchStatus!: EvidenceReproFetchStatusGql;

  @Field(() => EvidenceReproHashMatchGql)
  hashMatch!: EvidenceReproHashMatchGql;

  @Field(() => String, { nullable: true })
  fetchedHash?: string | null;

  @Field(() => String, { nullable: true })
  errorMessage?: string | null;
}
