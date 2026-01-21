import { gql } from '@apollo/client';

import { DOCUMENT_FRAGMENT } from './document.fragment';
import { MENTION_FRAGMENT } from './mention.fragment';

/**
 * Relationship evidence fragment.
 *
 * Trust contract requirements:
 * - Evidence must be inspectable (chunk + offsets + optional quote)
 * - Evidence must link to concrete mention IDs when available
 */
export const EVIDENCE_FRAGMENT = gql`
  fragment EvidenceFragment on EntityRelationshipEvidence {
    __typename
    id
    kind
    createdAt
    chunkId
    startOffset
    endOffset
    quotedText
    chunk {
      __typename
      id
      chunkIndex
      content
      documentId
      document {
        ...DocumentFragment
      }
    }
    mentionLinks {
      __typename
      evidenceId
      mentionId
      mention {
        ...MentionFragment
      }
    }
  }
  ${DOCUMENT_FRAGMENT}
  ${MENTION_FRAGMENT}
`;

