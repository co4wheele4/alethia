import { gql } from '@apollo/client';

/**
 * Contract-minimal EntityMention fragment.
 *
 * These offsets are the audit-grade anchor into `DocumentChunk.content`.
 * Confidence is forbidden by schema and must not appear in queries or mocks.
 */
export const ENTITY_MENTION_CONTRACT_FRAGMENT = gql`
  fragment EntityMentionContractFragment on EntityMention {
    __typename
    id
    chunkId
    startOffset
    endOffset
  }
`;

