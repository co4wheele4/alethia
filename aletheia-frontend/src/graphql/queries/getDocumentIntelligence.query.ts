import { gql } from '@apollo/client';

import { RELATIONSHIP_FRAGMENT } from '../fragments/relationship.fragment';
import { DOCUMENT_FRAGMENT } from '../fragments/document.fragment';
import { MENTION_FRAGMENT } from '../fragments/mention.fragment';

/**
 * Document Intelligence (read-only, provenance-faithful).
 *
 * Includes:
 * - Document provenance + chunks + mentions (offset-based)
 * - All relationships with evidence (filter client-side to the selected document)
 *
 * NOTE: The schema does not currently provide a "relationships by document" query.
 * We intentionally fetch `entityRelationships` and filter by evidence.chunk.documentId.
 */
export const GET_DOCUMENT_INTELLIGENCE_QUERY = gql`
  query GetDocumentIntelligence($id: String!) {
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
    entityRelationships {
      ...RelationshipFragment
    }
  }
  ${DOCUMENT_FRAGMENT}
  ${MENTION_FRAGMENT}
  ${RELATIONSHIP_FRAGMENT}
`;

