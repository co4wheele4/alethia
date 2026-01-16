/**
 * Documents GraphQL operations.
 *
 * Colocated with the documents feature to keep schema usage explicit and auditable.
 */
import { gql } from '@apollo/client';

export const DOCUMENTS_BY_USER_QUERY = gql`
  query DocumentsByUser($userId: String!) {
    documentsByUser(userId: $userId) {
      __typename
      id
      title
      createdAt
    }
  }
`;

/**
 * Document Index query (evidence-first)
 *
 * Purpose:
 * - render a non-interpretive document index (no summaries)
 * - show derived, inspectable counts (chunk count, entity count)
 *
 * Notes:
 * - We intentionally do NOT fetch chunk `content` here to keep the index lightweight.
 * - Source type is stored in the immutable provenance header (chunk 0 content), so it is not directly available here.
 */
export const DOCUMENT_INDEX_BY_USER_QUERY = gql`
  query DocumentIndexByUser($userId: String!) {
    documentsByUser(userId: $userId) {
      __typename
      id
      title
      createdAt
      chunks {
        __typename
        id
        chunkIndex
        mentions {
          __typename
          id
          entity {
            __typename
            id
            name
            type
          }
        }
      }
    }
  }
`;

export const CREATE_DOCUMENT_MUTATION = gql`
  mutation CreateDocument($title: String!, $userId: String!) {
    createDocument(title: $title, userId: $userId) {
      __typename
      id
      title
      createdAt
    }
  }
`;

export const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: String!) {
    deleteDocument(id: $id) {
      __typename
      id
    }
  }
`;

export const CREATE_CHUNK_MUTATION = gql`
  mutation CreateChunk($documentId: String!, $chunkIndex: Int!, $content: String!) {
    createChunk(documentId: $documentId, chunkIndex: $chunkIndex, content: $content) {
      __typename
      id
      chunkIndex
      content
      documentId
    }
  }
`;

export const DOCUMENT_QUERY = gql`
  query Document($id: String!) {
    document(id: $id) {
      __typename
      id
      title
      createdAt
    }
  }
`;

export const CHUNKS_BY_DOCUMENT_QUERY = gql`
  query ChunksByDocument($documentId: String!) {
    chunksByDocument(documentId: $documentId) {
      __typename
      id
      chunkIndex
      content
      mentions {
        __typename
        id
        startOffset
        endOffset
        spanText
        confidence
        entity {
          __typename
          id
          name
          type
        }
      }
    }
  }
`;

/**
 * Chunk 0 lookup for provenance display (index-safe).
 */
export const CHUNK0_BY_DOCUMENT_QUERY = gql`
  query Chunk0ByDocument($documentId: String!) {
    chunk0ByDocument(documentId: $documentId) {
      __typename
      id
      chunkIndex
      content
      documentId
      document {
        __typename
        id
        title
        createdAt
      }
    }
  }
`;

/**
 * Single chunk lookup (ID-first traversal).
 */
export const DOCUMENT_CHUNK_QUERY = gql`
  query DocumentChunk($id: String!) {
    documentChunk(id: $id) {
      __typename
      id
      chunkIndex
      content
      documentId
      document {
        __typename
        id
        title
        createdAt
      }
      mentions {
        __typename
        id
        startOffset
        endOffset
        spanText
        confidence
        entity {
          __typename
          id
          name
          type
        }
      }
    }
  }
`;

