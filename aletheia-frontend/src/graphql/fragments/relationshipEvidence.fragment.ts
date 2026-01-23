import { gql } from '@apollo/client';

import { DOCUMENT_FRAGMENT } from './document.fragment';
import { MENTION_FRAGMENT } from './mention.fragment';

/**
 * Relationship grounding evidence fragment (prescriptive name; ADR-005).
 *
 * Evidence must be inspectable: chunk + offsets + (optional) quote + mention links.
 * Confidence/probability is forbidden (ADR-006).
 */
export const RELATIONSHIP_EVIDENCE_FRAGMENT = gql`
  fragment RelationshipEvidenceFragment on EntityRelationshipEvidence {
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

