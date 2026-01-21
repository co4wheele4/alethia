import { gql } from '@apollo/client';

/**
 * Truth-contract fragment for Document.
 *
 * Required for provenance visibility:
 * - `sourceType` / `sourceLabel` summarize provenance at a glance
 * - `source` provides audit-grade linkage when present
 */
export const DOCUMENT_FRAGMENT = gql`
  fragment DocumentFragment on Document {
    __typename
    id
    title
    createdAt
    sourceType
    sourceLabel
    source {
      __typename
      id
      kind
      ingestedAt
      accessedAt
      publishedAt
      author
      publisher
      filename
      mimeType
      sizeBytes
      requestedUrl
      fetchedUrl
      contentSha256
      fileSha256
      lastModifiedMs
    }
  }
`;

