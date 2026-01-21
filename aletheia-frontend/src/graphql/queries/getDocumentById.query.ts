import { gql } from '@apollo/client';

import { DOCUMENT_FRAGMENT } from '../fragments/document.fragment';
import { MENTION_FRAGMENT } from '../fragments/mention.fragment';

/**
 * Get a document and its inspectable evidence surface.
 *
 * Includes:
 * - document provenance (DocumentFragment)
 * - chunks (content)
 * - mentions with offsets + entity linkage (MentionFragment)
 */
export const GET_DOCUMENT_BY_ID_QUERY = gql`
  query GetDocumentById($id: String!) {
    document(id: $id) {
      ...DocumentFragment
      chunks {
        __typename
        id
        chunkIndex
        content
        documentId
        mentions {
          ...MentionFragment
        }
      }
    }
  }
  ${DOCUMENT_FRAGMENT}
  ${MENTION_FRAGMENT}
`;

