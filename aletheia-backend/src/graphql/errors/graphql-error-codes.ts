import { GraphQLError } from 'graphql';

/**
 * Canonical GraphQL contract error codes (P0 governance).
 *
 * Rules:
 * - Preserve error strings exactly (code === message === extensions.code).
 * - Do not introduce new semantics via error messaging.
 */
export const GQL_ERROR_CODES = {
  // Auth / access
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNAUTHORIZED_REVIEWER: 'UNAUTHORIZED_REVIEWER',
  NOT_ASSIGNED_REVIEWER: 'NOT_ASSIGNED_REVIEWER',

  // Claims
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  CLAIM_NOT_EVIDENCE_CLOSED: 'CLAIM_NOT_EVIDENCE_CLOSED',
  INVALID_LIFECYCLE_TRANSITION: 'INVALID_LIFECYCLE_TRANSITION',

  // Review coordination
  DUPLICATE_REVIEW_REQUEST: 'DUPLICATE_REVIEW_REQUEST',
  REVIEW_REQUEST_NOT_FOUND: 'REVIEW_REQUEST_NOT_FOUND',
  REVIEWER_NOT_ELIGIBLE: 'REVIEWER_NOT_ELIGIBLE',
  DUPLICATE_ASSIGNMENT: 'DUPLICATE_ASSIGNMENT',

  // Reviewer responses
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  DUPLICATE_RESPONSE: 'DUPLICATE_RESPONSE',
} as const;

export type GraphQLContractErrorCode =
  (typeof GQL_ERROR_CODES)[keyof typeof GQL_ERROR_CODES];

export function contractError(code: GraphQLContractErrorCode): GraphQLError {
  // Enforce canonical shape: message matches extensions.code.
  return new GraphQLError(code, { extensions: { code } });
}
