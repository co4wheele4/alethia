import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@InputType()
export class CreateEntityMentionInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  entityId!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  chunkId!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  startOffset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  endOffset?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  spanText?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  confidence?: number;
}

@InputType()
export class UpdateEntityMentionInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  chunkId?: string;
}
