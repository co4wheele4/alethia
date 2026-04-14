import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ImportResult {
  @Field(() => Int)
  importedClaims!: number;

  @Field(() => Int)
  importedEvidence!: number;
}
