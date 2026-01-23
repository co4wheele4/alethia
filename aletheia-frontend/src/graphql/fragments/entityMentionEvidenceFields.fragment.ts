import { gql } from '@apollo/client';

import { ENTITY_CORE_FIELDS } from './entityCoreFields.fragment';

/**
 * Truth Surface v1: mention evidence anchors.
 *
 * NOTE:
 * - Offsets are nullable in schema for legacy mentions, but Truth Surface v1 requires them.
 *   The UI must fail loudly if they are missing.
 */
export const ENTITY_MENTION_EVIDENCE_FIELDS = gql`
  fragment EntityMentionEvidenceFields on EntityMention {
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

