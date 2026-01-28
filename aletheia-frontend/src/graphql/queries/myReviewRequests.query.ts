import { gql } from '@apollo/client';

import { REVIEW_REQUEST_FIELDS } from '../fragments/reviewRequest.fragment';

/**
 * Review requests created by the current user (coordination-only).
 */
export const MY_REVIEW_REQUESTS_QUERY = gql`
  query MyReviewRequests {
    myReviewRequests {
      ...ReviewRequestFields
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

