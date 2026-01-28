import { gql } from '@apollo/client';

import { REVIEW_REQUEST_FIELDS } from '../fragments/reviewRequest.fragment';

/**
 * Reviewer queue (unassigned): review requests visible in the current workspace.
 * Coordination-only: does not mutate claim lifecycle.
 */
export const REVIEW_QUEUE_QUERY = gql`
  query ReviewQueue {
    reviewQueue {
      ...ReviewRequestFields
    }
  }
  ${REVIEW_REQUEST_FIELDS}
`;

