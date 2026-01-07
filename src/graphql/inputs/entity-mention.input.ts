import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
