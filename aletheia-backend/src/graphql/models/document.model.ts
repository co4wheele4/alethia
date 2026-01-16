import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from './user.model';
import { DocumentChunk } from './document-chunk.model';
import { DocumentSource, DocumentSourceKind } from './document-source.model';

@ObjectType()
export class Document {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => User)
  user!: User;

  @Field()
  createdAt!: Date;

  @Field(() => [DocumentChunk])
  chunks!: DocumentChunk[];

  @Field(() => DocumentSourceKind, {
    nullable: true,
    description:
      'Declared provenance type for this document (persisted; nullable for legacy documents).',
  })
  sourceType?: DocumentSourceKind | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Human-readable provenance label for this document (persisted; nullable for legacy documents).',
  })
  sourceLabel?: string | null;

  @Field(() => DocumentSource, {
    nullable: true,
    description:
      'Structured source metadata for this document snapshot. Nullable for backward safety; if absent, the document is epistemically incomplete.',
  })
  source?: DocumentSource | null;
}
