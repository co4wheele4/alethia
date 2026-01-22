/**
 * Documents GraphQL operations.
 *
 * Colocated with the documents feature to keep schema usage explicit and auditable.
 */
import { gql } from '@apollo/client';
import { ENTITY_BASIC_FIELDS, MENTION_FIELDS } from '../entities/graphql';

export const DOCUMENT_FIELDS = gql`
  fragment DocumentFields on Document {
    __typename
    id
    title
    createdAt
    sourceType
    sourceLabel
  }
`;

export const CHUNK_FIELDS = gql`
  fragment ChunkFields on DocumentChunk {
    __typename
    id
    chunkIndex
    content
    documentId
  }
`;

export const DOCUMENTS_BY_USER_QUERY = gql`
  query DocumentsByUser($userId: String!) {
    documentsByUser(userId: $userId) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS}
`;

/**
 * Document Index query (evidence-first)
 */
export const DOCUMENT_INDEX_BY_USER_QUERY = gql`
  query DocumentIndexByUser($userId: String!) {
    documentsByUser(userId: $userId) {
      ...DocumentFields
      chunks {
        __typename
        id
        chunkIndex
        mentions {
          __typename
          id
          entity {
            ...EntityBasicFields
          }
        }
      }
    }
  }
  ${DOCUMENT_FIELDS}
  ${ENTITY_BASIC_FIELDS}
`;

export const CREATE_DOCUMENT_MUTATION = gql`
  mutation CreateDocument($title: String!, $userId: String!) {
    createDocument(title: $title, userId: $userId) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS}
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
      ...ChunkFields
    }
  }
  ${CHUNK_FIELDS}
`;

export const DOCUMENT_QUERY = gql`
  query Document($id: String!) {
    document(id: $id) {
      ...DocumentFields
    }
  }
  ${DOCUMENT_FIELDS}
`;

export const CHUNKS_BY_DOCUMENT_QUERY = gql`
  query ChunksByDocument($documentId: String!) {
    chunksByDocument(documentId: $documentId) {
      ...ChunkFields
      mentions {
        ...MentionFields
        entity {
          ...EntityBasicFields
        }
      }
    }
  }
  ${CHUNK_FIELDS}
  ${MENTION_FIELDS}
  ${ENTITY_BASIC_FIELDS}
`;

export const CHUNK0_BY_DOCUMENT_QUERY = gql`
  query Chunk0ByDocument($documentId: String!) {
    chunk0ByDocument(documentId: $documentId) {
      ...ChunkFields
      document {
        ...DocumentFields
      }
    }
  }
  ${CHUNK_FIELDS}
  ${DOCUMENT_FIELDS}
`;

export const DOCUMENT_CHUNK_QUERY = gql`
  query DocumentChunk($id: String!) {
    documentChunk(id: $id) {
      ...ChunkFields
      document {
        ...DocumentFields
      }
      mentions {
        ...MentionFields
        entity {
          ...EntityBasicFields
        }
      }
    }
  }
  ${CHUNK_FIELDS}
  ${DOCUMENT_FIELDS}
  ${MENTION_FIELDS}
  ${ENTITY_BASIC_FIELDS}
`;
