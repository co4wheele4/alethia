import { gql } from '@apollo/client';

/**
 * Entity fragment.
 *
 * Entities are extracted, not authored. UI must always offer a path to mentions/evidence.
 */
export const ENTITY_FRAGMENT = gql`
  fragment EntityFragment on Entity {
    __typename
    id
    name
    type
    mentionCount
  }
`;

