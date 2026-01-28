import { gql } from '@apollo/client';

import { REVIEW_REQUEST_FIELDS } from '../fragments/reviewRequest.fragment';

/**
 * Request human review of a claim (coordination-only; does not change claim status).
 *
 * Explicit backend errors:
 * - UNAUTHORIZED
 * - CLAIM_NOT_FOUND
 * - DUPLICATE_REVIEW_REQUEST
 */
export const REQUEST_REVIEW_MUTATION = gql`
  mutation RequestReview($claimId: ID!, $source: ReviewRequestSource!, $note: String) {
    requestReview(claimId: $claimId, source: $source, note: $note) {
      ...ReviewRequestFields
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

