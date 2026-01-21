import { gql } from '@apollo/client';

import { ENTITY_FRAGMENT } from './entity.fragment';

/**
 * Mention fragment.
 *
 * Trust contract requirements:
 * - Offsets (`startOffset`, `endOffset`) must be visible for auditability.
 * - `excerpt` is best-effort; offsets are the authoritative anchor into chunk content.
 */
export const MENTION_FRAGMENT = gql`
  fragment MentionFragment on EntityMention {
    __typename
    id
    entityId
    chunkId
    startOffset
    endOffset
    excerpt
    entity {
      ...EntityFragment
    }
  }
  ${ENTITY_FRAGMENT}
`;

