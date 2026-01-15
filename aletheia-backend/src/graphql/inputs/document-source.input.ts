import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * DocumentSourceKindInput
 *
 * Separate enum for inputs to keep GraphQL contract explicit.
 */
export enum DocumentSourceKindInput {
  MANUAL = 'MANUAL',
  FILE = 'FILE',
  URL = 'URL',
}

registerEnumType(DocumentSourceKindInput, {
  name: 'DocumentSourceKindInput',
  description: 'Declared source kind for document ingestion.',
});

@InputType()
export class CreateDocumentSourceInput {
  @Field(() => DocumentSourceKindInput)
  @IsEnum(DocumentSourceKindInput)
  kind!: DocumentSourceKindInput;

  // FILE (nullable unless kind=FILE)
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  filename?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  mimeType?: string;

  @Field({ nullable: true })
  @IsOptional()
  sizeBytes?: number;

  @Field({ nullable: true, description: 'Milliseconds since epoch, as string.' })
  @IsOptional()
  @IsString()
  lastModifiedMs?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileSha256?: string;

  // URL (nullable unless kind=URL)
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  requestedUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fetchedUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contentType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  publisher?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  author?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  publishedAt?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  accessedAt?: Date;

  // audit
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contentSha256?: string;
}

@InputType()
export class UpsertDocumentSourceInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  documentId!: string;

  @Field(() => CreateDocumentSourceInput)
  source!: CreateDocumentSourceInput;
}

