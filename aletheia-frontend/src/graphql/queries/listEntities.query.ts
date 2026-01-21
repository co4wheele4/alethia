import { gql } from '@apollo/client';

import { ENTITY_FRAGMENT } from '../fragments/entity.fragment';

/**
 * List extracted entities (read-only).
 *
 * Entities alone are not truth; consumers must provide a path to mentions/evidence.
 */
export const LIST_ENTITIES_QUERY = gql`
  query ListEntities {
    entities {
      ...EntityFragment
    }
  }
  ${ENTITY_FRAGMENT}
`;

