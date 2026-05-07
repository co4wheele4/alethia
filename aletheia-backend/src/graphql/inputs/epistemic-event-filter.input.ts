import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsOptional, IsString } from 'class-validator';

@InputType()
export class EpistemicEventFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  createdAfter?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  createdBefore?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  errorCode?: string;
}
