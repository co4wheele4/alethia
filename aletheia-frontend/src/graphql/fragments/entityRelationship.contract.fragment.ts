import { gql } from '@apollo/client';

/**
 * Contract-minimal EntityRelationship fragment.
 *
 * Note on `sourceEntityId` / `targetEntityId` / `type`:
 * - The authoritative schema represents endpoints as `from` and `to` (Entity objects),
 *   and the relationship "type" as `relation` (String).
 * - There are NO top-level `sourceEntityId`/`targetEntityId` fields to query.
 */
export const ENTITY_RELATIONSHIP_CONTRACT_FRAGMENT = gql`
  fragment EntityRelationshipContractFragment on EntityRelationship {
    __typename
    id
    relation
    from {
      __typename
      id
    }
    to {
      __typename
      id
    }
  }
`;

