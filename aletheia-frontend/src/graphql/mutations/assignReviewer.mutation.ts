import { gql } from '@apollo/client';

/**
 * Assign a reviewer (coordination-only; does not change truth, claim status, or adjudication).
 *
 * Explicit backend errors:
 * - UNAUTHORIZED
 * - REVIEW_REQUEST_NOT_FOUND
 * - REVIEWER_NOT_ELIGIBLE
 * - DUPLICATE_ASSIGNMENT
 */
export const ASSIGN_REVIEWER_MUTATION = gql`
  mutation AssignReviewer($reviewRequestId: ID!, $reviewerUserId: ID!) {
    assignReviewer(reviewRequestId: $reviewRequestId, reviewerUserId: $reviewerUserId) {
      __typename
      id
      reviewRequestId
      reviewerUserId
      assignedByUserId
      assignedAt
    }
  }
`;

