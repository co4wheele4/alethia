import { gql } from '@apollo/client';

import { CLAIM_COMPARISON_ASSERTION_FIELDS, CLAIM_COMPARISON_EVIDENCE_FIELDS } from '../fragments/ClaimComparison.fragment';

/**
 * Claim Comparison query.
 *
 * Note: the backend schema does not currently support fetching a single Claim by ID,
 * so the comparison view selects two claims client-side from the returned list.
 */
export const GET_CLAIMS_FOR_COMPARISON_QUERY = gql`
  query GetClaimsForComparison($limit: Int!, $offset: Int!) {
    claims(limit: $limit, offset: $offset) {
      ...ClaimComparisonAssertionFields
      ...ClaimComparisonEvidenceFields
    }
  }
  ${CLAIM_COMPARISON_ASSERTION_FIELDS}
  ${CLAIM_COMPARISON_EVIDENCE_FIELDS}
`;

