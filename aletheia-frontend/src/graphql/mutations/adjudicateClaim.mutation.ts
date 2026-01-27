import { gql } from '@apollo/client';

/**
 * Claim adjudication mutation (ADR-011).
 *
 * Contract constraints:
 * - Must match the backend mutation shape exactly.
 * - No confidence/comparison fields.
 */
export const ADJUDICATE_CLAIM_MUTATION = gql`
  mutation AdjudicateClaim($claimId: ID!, $decision: ClaimLifecycleState!, $reviewerNote: String) {
    adjudicateClaim(claimId: $claimId, decision: $decision, reviewerNote: $reviewerNote) {
      id
      status
      reviewedAt
      reviewedBy
      reviewerNote
    }
  }
`;

