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

