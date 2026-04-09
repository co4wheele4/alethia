import { Field, ID, InputType } from '@nestjs/graphql';
import { ClaimStatus } from '@models/claim.model';

@InputType()
export class ExportBundleInput {
  @Field(() => [ID], { nullable: true })
  claimIds?: string[];

  @Field(() => ClaimStatus, { nullable: true })
  lifecycle?: ClaimStatus;

  @Field({ nullable: true })
  createdAfter?: Date;

  @Field({ nullable: true })
  createdBefore?: Date;

  @Field({
    nullable: true,
    description: 'Include epistemic audit rows (explicit opt-in).',
  })
  includeEpistemicEvents?: boolean;

  @Field({ nullable: true })
  epistemicEventsAfter?: Date;

  @Field({ nullable: true })
  epistemicEventsBefore?: Date;
}
