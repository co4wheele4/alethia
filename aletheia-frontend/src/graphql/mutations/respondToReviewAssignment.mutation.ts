import { gql } from '@apollo/client';

/**
 * Respond to a review assignment (coordination-only; does not determine truth or claim status).
 *
 * Explicit backend errors:
 * - UNAUTHORIZED
 * - ASSIGNMENT_NOT_FOUND
 * - NOT_ASSIGNED_REVIEWER
 * - DUPLICATE_RESPONSE
 */
export const RESPOND_TO_REVIEW_ASSIGNMENT_MUTATION = gql`
  mutation RespondToReviewAssignment(
    $reviewAssignmentId: ID!
    $response: ReviewerResponseType!
    $note: String
  ) {
    respondToReviewAssignment(
      reviewAssignmentId: $reviewAssignmentId
      response: $response
      note: $note
    ) {
      __typename
      id
      reviewAssignmentId
      reviewerUserId
      response
      respondedAt
      note
    }
  }
`;

