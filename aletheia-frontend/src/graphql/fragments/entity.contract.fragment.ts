import { gql } from '@apollo/client';

/**
 * Contract-minimal Entity fragment.
 *
 * Note on `label`:
 * - The authoritative schema uses `Entity.name` (not `label`).
 * - We MUST query `name` to remain schema-faithful.
 */
export const ENTITY_CONTRACT_FRAGMENT = gql`
  fragment EntityContractFragment on Entity {
    __typename
    id
    name
    type
  }
`;

