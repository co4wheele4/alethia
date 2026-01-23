import { gql } from '@apollo/client';

/**
 * Truth Surface v1: minimal entity fields required to label mention evidence.
 *
 * Contract: no confidence/probability fields exist in schema (ADR-005/006).
 */
export const ENTITY_CORE_FIELDS = gql`
  fragment EntityCoreFields on Entity {
    __typename
    id
    name
    type
    mentionCount
  }
`;

