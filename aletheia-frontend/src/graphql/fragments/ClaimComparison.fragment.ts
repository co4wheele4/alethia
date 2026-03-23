import { gql } from '@apollo/client';

import { EVIDENCE_FIELDS } from './claim.fragment';
import { DOCUMENT_EVIDENCE_VIEW } from './documentEvidenceView.fragment';

/**
 * Claim Comparison (read-only inspection surface).
 *
 * ADR constraints:
 * - Neutral comparison only (ADR-009/010) — no conflict inference/labels.
 * - Confidence is forbidden unless schema adds it (ADR-006).
 * - Evidence is primary: we fetch documents → chunks → mentions for offset-grounded inspection (ADR-004/005/007).
 */
export const CLAIM_COMPARISON_ASSERTION_FIELDS = gql`
  fragment ClaimComparisonAssertionFields on Claim {
    __typename
    id
    text
    status
    createdAt
  }
`;

export const CLAIM_COMPARISON_EVIDENCE_FIELDS = gql`
  fragment ClaimComparisonEvidenceFields on Claim {
    evidence {
      ...EvidenceFields
    }
    documents {
      ...DocumentEvidenceView
    }
  }
  ${EVIDENCE_FIELDS}
  ${DOCUMENT_EVIDENCE_VIEW}
`;

