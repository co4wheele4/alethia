import { gql } from '@apollo/client';

/**
 * Review requests (coordination-only; does not change claim truth or lifecycle).
 *
 * Contract constraints:
 * - Must match `/src/schema.gql`
 * - Must not include confidence/probability
 */
export const REVIEW_REQUEST_FIELDS = gql`
  fragment ReviewRequestFields on ReviewRequest {
    __typename
    id
    claimId
    requestedAt
    source
    note
    requestedBy {
      __typename
      id
      email
      name
    }
    reviewAssignments {
      __typename
      id
      reviewRequestId
      reviewerUserId
      assignedByUserId
      assignedAt
    }
  }
`;

