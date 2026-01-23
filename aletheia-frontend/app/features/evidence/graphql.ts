/**
 * Evidence (Truth Surface v1) GraphQL operations.
 *
 * Contract rules (ADR-005 / schema-fidelity):
 * - Only use fields present in `src/schema.gql`
 * - Confidence/probability fields are forbidden (and Apollo/MSW will fail if they appear)
 * - Provenance must be explicit (Document.sourceType/sourceLabel/source)
 * - Evidence linkage must be explicit (chunk + offsets)
 */
import { gql } from '@apollo/client';

/**
 * Required fragment (prescriptive name).
 *
 * Includes provenance summary + source metadata needed for audit-grade display.
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

/**
 * Required fragment (prescriptive name).
 */
export const ENTITY_CORE_FIELDS = gql`
  fragment EntityCoreFields on Entity {
    __typename
    id
    name
    type
    mentionCount
  }
`;

/**
 * Required fragment (prescriptive name).
 *
 * Note: offsets are nullable in schema for legacy mentions, but Truth Surface v1 requires them.
 * The UI layer will fail loudly if they are absent.
 */
export const ENTITY_MENTION_EVIDENCE_FIELDS = gql`
  fragment EntityMentionEvidenceFields on EntityMention {
    __typename
    id
    entityId
    chunkId
    startOffset
    endOffset
    excerpt
    entity {
      ...EntityCoreFields
    }
  }
  ${ENTITY_CORE_FIELDS}
`;

/**
 * Required fragment (prescriptive name).
 *
 * This is the single read model for the Truth Surface v1:
 * Document -> Chunks (text) -> Mentions (offset evidence) -> Entities.
 */
export const DOCUMENT_EVIDENCE_VIEW = gql`
  fragment DocumentEvidenceView on Document {
    ...DocumentCoreFields
    chunks {
      __typename
      id
      chunkIndex
      content
      documentId
      mentions {
        ...EntityMentionEvidenceFields
      }
    }
  }
  ${DOCUMENT_CORE_FIELDS}
  ${ENTITY_MENTION_EVIDENCE_FIELDS}
`;

export const GET_DOCUMENT_EVIDENCE_VIEW_QUERY = gql`
  query GetDocumentEvidenceView($id: String!) {
    document(id: $id) {
      ...DocumentEvidenceView
    }
  }
  ${DOCUMENT_EVIDENCE_VIEW}
`;

