import { Field, Int, ObjectType } from '@nestjs/graphql';

/** ADR-036: Structural integrity report (counts only). */
@ObjectType()
export class IntegrityReport {
  @Field(() => Int)
  adjudicationMissingHashCount!: number;

  @Field(() => Int)
  adjudicationBrokenChainCount!: number;

  @Field(() => Int)
  adjudicationHashMismatchCount!: number;

  @Field(() => Int)
  evidenceMissingContentHashCount!: number;
}
