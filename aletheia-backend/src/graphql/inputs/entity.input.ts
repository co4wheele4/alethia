import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateEntityInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  type!: string;
}

@InputType()
export class UpdateEntityInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;
}
