import { gql } from '@apollo/client';

/**
 * Truth Surface v1 (Document → Evidence Viewer)
 *
 * ADR constraints:
 * - Schema-faithful (see `/src/schema.gql`)
 * - Confidence/probability is forbidden (ADR-005, ADR-006)
 * - Provenance must be explicit and inspectable (ADR-004, ADR-005)
 */
export const DOCUMENT_CORE_FIELDS = gql`
  fragment DocumentCoreFields on Document {
    __typename
    id
    title
    createdAt
    sourceType
    sourceLabel
    source {
      __typename
      id
      documentId
      kind
      ingestedAt
      accessedAt
      publishedAt
      author
      publisher
      filename
      mimeType
      contentType
      sizeBytes
      requestedUrl
      fetchedUrl
      contentSha256
      fileSha256
      lastModifiedMs
    }
  }
`;

