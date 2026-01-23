import { gql } from '@apollo/client';

import { ENTITY_CORE_FIELDS } from './entityCoreFields.fragment';

/**
 * Evidence inspection fragment for entity mentions (prescriptive name; ADR-005).
 *
 * Offsets are nullable in schema for legacy rows; evidence inspection requires offsets at runtime.
 */
export const ENTITY_MENTION_FRAGMENT = gql`
  fragment EntityMentionFragment on EntityMention {
    __typename
    id
    entityId
    chunkId
    startOffset
    endOffset
    excerpt
    entity {
      ...EntityCoreFields
    }
  }
  ${ENTITY_CORE_FIELDS}
`;

