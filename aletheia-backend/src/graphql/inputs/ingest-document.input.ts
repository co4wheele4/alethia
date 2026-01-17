import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDocumentSourceInput } from './document-source.input';

@InputType()
export class IngestDocumentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @Field(() => CreateDocumentSourceInput)
  @ValidateNested()
  @Type(() => CreateDocumentSourceInput)
  source!: CreateDocumentSourceInput;
}
