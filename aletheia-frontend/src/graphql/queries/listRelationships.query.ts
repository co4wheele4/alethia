import { gql } from '@apollo/client';

import { RELATIONSHIP_FRAGMENT } from '../fragments/relationship.fragment';

/**
 * List relationships for evidence-first inspection (read-only).
 */
export const LIST_RELATIONSHIPS_QUERY = gql`
  query ListRelationships {
    entityRelationships {
      ...RelationshipFragment
    }
  }
  ${RELATIONSHIP_FRAGMENT}
`;

