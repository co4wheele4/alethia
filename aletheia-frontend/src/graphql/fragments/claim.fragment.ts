import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FIELDS } from './documentCoreFields.fragment';

/**
 * Evidence fields for claim grounding (ADR-019 / ADR-024).
 * Evidence is a reference to source material; no confidence or inference.
 */
export const EVIDENCE_FIELDS = gql`
  fragment EvidenceFields on Evidence {
    __typename
    id
    createdAt
    createdBy
    sourceType
    sourceDocumentId
    chunkId
    startOffset
    endOffset
    snippet
    contentSha256
  }
`;

/**
 * Claim inspection fragments (read-only; evidence-grounded).
 *
 * Contract constraints:
 * - Claims must always include non-empty evidence[]
 * - No confidence/probability/scoring fields (ADR-006)
 * - Documents are derived from evidence anchors (no implicit summarization)
 */
export const CLAIM_FIELDS = gql`
  fragment ClaimFields on Claim {
    __typename
    id
    text
    status
    createdAt
    evidence {
      ...EvidenceFields
    }
    documents {
      ...DocumentCoreFields
    }
  }
  ${EVIDENCE_FIELDS}
  ${DOCUMENT_CORE_FIELDS}
`;

