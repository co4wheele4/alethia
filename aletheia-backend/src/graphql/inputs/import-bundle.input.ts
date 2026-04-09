import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

@InputType()
export class ImportBundleInput {
  @Field(() => GraphQLJSON, {
    description:
      'Aletheia bundle object matching schemas/aletheiaBundle.schema.json',
  })
  bundle!: Record<string, unknown>;

  @Field()
  allowOverwrite!: boolean;
}
