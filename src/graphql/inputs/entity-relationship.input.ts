import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateEntityRelationshipInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  fromEntity!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  toEntity!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  relation!: string;
}

@InputType()
export class UpdateEntityRelationshipInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  fromEntity?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  toEntity?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  relation?: string;
}
