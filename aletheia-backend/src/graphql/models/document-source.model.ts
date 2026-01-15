import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * DocumentSourceKind
 *
 * Epistemic note:
 * - This is the *declared* source kind for a document snapshot.
 * - It is not inferred from content.
 */
export enum DocumentSourceKind {
  MANUAL = 'MANUAL',
  FILE = 'FILE',
  URL = 'URL',
}

registerEnumType(DocumentSourceKind, {
  name: 'DocumentSourceKind',
  description: 'Declared source kind for an ingested document snapshot.',
});

@ObjectType()
export class DocumentSource {
  @Field(() => ID)
  id!: string;

  @Field()
  documentId!: string;

  @Field(() => DocumentSourceKind)
  kind!: DocumentSourceKind;

  @Field(() => Date, {
    nullable: true,
    description:
      'When the source snapshot was ingested (nullable for legacy documents).',
  })
  ingestedAt?: Date | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Best-effort digest of the ingested text snapshot (audit signal).',
  })
  contentSha256?: string | null;

  // FILE metadata (nullable unless kind=FILE)
  @Field(() => String, { nullable: true })
  filename?: string | null;

  @Field(() => String, { nullable: true })
  mimeType?: string | null;

  @Field(() => Int, { nullable: true })
  sizeBytes?: number | null;

  @Field(() => String, {
    nullable: true,
    description:
      'File last-modified time in milliseconds since epoch (string to avoid BigInt scalar).',
  })
  lastModifiedMs?: string | null;

  @Field(() => String, { nullable: true })
  fileSha256?: string | null;

  // URL metadata (nullable unless kind=URL)
  @Field(() => String, { nullable: true })
  requestedUrl?: string | null;

  @Field(() => String, { nullable: true })
  fetchedUrl?: string | null;

  @Field(() => String, { nullable: true })
  contentType?: string | null;

  @Field(() => String, { nullable: true })
  publisher?: string | null;

  @Field(() => String, { nullable: true })
  author?: string | null;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  accessedAt?: Date | null;
}
