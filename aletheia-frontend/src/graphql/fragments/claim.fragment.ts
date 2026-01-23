import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FIELDS } from './documentCoreFields.fragment';

/**
 * Claim inspection fragments (read-only; evidence-grounded).
 *
 * Contract constraints:
 * - Claims must always include non-empty evidence[]
 * - No confidence/probability/scoring fields (ADR-006)
 * - Documents are derived from evidence anchors (no implicit summarization)
 */
export const CLAIM_EVIDENCE_FIELDS = gql`
  fragment ClaimEvidenceFields on ClaimEvidence {
    __typename
    id
    claimId
    documentId
    createdAt
    mentionIds
    relationshipIds
  }
`;

export const CLAIM_FIELDS = gql`
  fragment ClaimFields on Claim {
    __typename
    id
    text
    status
    createdAt
    evidence {
      ...ClaimEvidenceFields
    }
    documents {
      ...DocumentCoreFields
    }
  }
  ${CLAIM_EVIDENCE_FIELDS}
  ${DOCUMENT_CORE_FIELDS}
`;

