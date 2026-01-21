/**
 * Entities GraphQL operations.
 *
 * Entities are extracted, not authored. UI must never present them as ground truth
 * without showing mentions and source linkage.
 */

import { gql } from '@apollo/client';

export const ENTITY_BASIC_FIELDS = gql`
  fragment EntityBasicFields on Entity {
    __typename
    id
    name
    type
    mentionCount
  }
`;

export const MENTION_FIELDS = gql`
  fragment MentionFields on EntityMention {
    __typename
    id
    startOffset
    endOffset
    spanText
    confidence
  }
`;

export const ENTITIES_QUERY = gql`
  query Entities {
    entities {
      ...EntityBasicFields
    }
  }
  ${ENTITY_BASIC_FIELDS}
`;

export const ENTITY_QUERY = gql`
  query Entity($id: String!) {
    entity(id: $id) {
      ...EntityBasicFields
      outgoing {
        __typename
        id
        relation
        to {
          ...EntityBasicFields
        }
        evidence {
          __typename
          id
          kind
          createdAt
          startOffset
          endOffset
          quotedText
          chunkId
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
          mentionLinks {
            __typename
            evidenceId
            mentionId
            mention {
              ...MentionFields
              entity {
                ...EntityBasicFields
              }
            }
          }
        }
      }
      incoming {
        __typename
        id
        relation
        from {
          ...EntityBasicFields
        }
        evidence {
          __typename
          id
          kind
          createdAt
          startOffset
          endOffset
          quotedText
          chunkId
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
          mentionLinks {
            __typename
            evidenceId
            mentionId
            mention {
              ...MentionFields
              entity {
                ...EntityBasicFields
              }
            }
          }
        }
      }
      mentions {
        ...MentionFields
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
  ${ENTITY_BASIC_FIELDS}
  ${MENTION_FIELDS}
`;
