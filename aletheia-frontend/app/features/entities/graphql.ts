/**
 * Entities GraphQL operations.
 *
 * Entities are extracted, not authored. UI must never present them as ground truth
 * without showing mentions and source linkage.
 */

import { gql } from '@apollo/client';

export const ENTITIES_QUERY = gql`
  query Entities {
    entities {
      __typename
      id
      name
      type
    }
  }
`;

export const ENTITY_QUERY = gql`
  query Entity($id: String!) {
    entity(id: $id) {
      __typename
      id
      name
      type
      outgoing {
        __typename
        id
        relation
        to {
          __typename
          id
          name
          type
        }
      }
      incoming {
        __typename
        id
        relation
        from {
          __typename
          id
          name
          type
        }
      }
      mentions {
        __typename
        id
        chunk {
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
    }
  }
`;

