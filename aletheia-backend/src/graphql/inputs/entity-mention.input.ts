import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

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

  @Field(() => Int)
  @IsInt()
  @Min(0)
  startOffset!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  endOffset!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  excerpt?: string;
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
