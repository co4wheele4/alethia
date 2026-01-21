import { gql } from '@apollo/client';

/**
 * Contract-minimal DocumentChunk fragment.
 *
 * Chunk content is the ground truth text for mention offsets and evidence spans.
 * No confidence/probability fields are allowed (schema does not expose them).
 */
export const DOCUMENT_CHUNK_CONTRACT_FRAGMENT = gql`
  fragment DocumentChunkContractFragment on DocumentChunk {
    __typename
    id
    content
  }
`;

