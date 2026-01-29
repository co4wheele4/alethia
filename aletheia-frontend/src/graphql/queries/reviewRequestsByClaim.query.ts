import { gql } from '@apollo/client';

import { REVIEW_REQUEST_FIELDS } from '../fragments/reviewRequest.fragment';

/**
 * Review activity for a single claim (read-only; coordination metadata only).
 *
 * Contract constraints:
 * - Must match `/src/schema.gql`
 * - Must not request confidence/probability/truthScore fields
 * - Must not request claim lifecycle fields (reviewedAt/reviewedBy/reviewerNote) via this surface
 */
export const REVIEW_REQUESTS_BY_CLAIM_QUERY = gql`
  query ReviewRequestsByClaim($claimId: ID!) {
    reviewRequestsByClaim(claimId: $claimId) {
      ...ReviewRequestFields
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

