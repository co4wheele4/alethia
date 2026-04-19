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
  /** createClaim: trimmed claim text must be non-empty. */
  CLAIM_TEXT_REQUIRED: 'CLAIM_TEXT_REQUIRED',
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  CLAIM_NOT_EVIDENCE_CLOSED: 'CLAIM_NOT_EVIDENCE_CLOSED',
  /** ADR-023: adjudicateClaim only — claim lacks evidence anchors required for adjudication. */
  EVIDENCE_REQUIRED_FOR_ADJUDICATION: 'EVIDENCE_REQUIRED_FOR_ADJUDICATION',
  INVALID_LIFECYCLE_TRANSITION: 'INVALID_LIFECYCLE_TRANSITION',
  /** ADR-030: mechanical quorum precondition not satisfied. */
  REVIEW_QUORUM_NOT_MET: 'REVIEW_QUORUM_NOT_MET',

  // Bundle (ADR-031)
  BUNDLE_VALIDATION_FAILED: 'BUNDLE_VALIDATION_FAILED',
  IMPORT_COLLISION: 'IMPORT_COLLISION',

  // Evidence (ADR-019)
  EVIDENCE_SOURCE_REQUIRED: 'EVIDENCE_SOURCE_REQUIRED',
  EVIDENCE_LOCATOR_REQUIRED: 'EVIDENCE_LOCATOR_REQUIRED',
  EVIDENCE_MALFORMED_OFFSETS: 'EVIDENCE_MALFORMED_OFFSETS',
  EVIDENCE_SOURCE_NOT_FOUND: 'EVIDENCE_SOURCE_NOT_FOUND',
  EVIDENCE_CHUNK_NOT_IN_SOURCE: 'EVIDENCE_CHUNK_NOT_IN_SOURCE',
  EVIDENCE_NOT_FOUND: 'EVIDENCE_NOT_FOUND',
  /** ADR-024: DOCUMENT evidence requires non-empty verbatim snippet matching chunk offsets. */
  EVIDENCE_VERBATIM_REQUIRED: 'EVIDENCE_VERBATIM_REQUIRED',

  // Review coordination
  DUPLICATE_REVIEW_REQUEST: 'DUPLICATE_REVIEW_REQUEST',
  REVIEW_REQUEST_NOT_FOUND: 'REVIEW_REQUEST_NOT_FOUND',
  REVIEWER_NOT_ELIGIBLE: 'REVIEWER_NOT_ELIGIBLE',
  DUPLICATE_ASSIGNMENT: 'DUPLICATE_ASSIGNMENT',

  // Reviewer responses
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  DUPLICATE_RESPONSE: 'DUPLICATE_RESPONSE',

  // ADR-022: Query non-semantic constraint
  DERIVED_SEMANTICS_FORBIDDEN: 'DERIVED_SEMANTICS_FORBIDDEN',

  // ADR-033: Search pagination bounds
  INVALID_SEARCH_PAGINATION: 'INVALID_SEARCH_PAGINATION',

  // ADR-034: Query complexity / depth + list pagination
  QUERY_DEPTH_EXCEEDED: 'QUERY_DEPTH_EXCEEDED',
  QUERY_COST_EXCEEDED: 'QUERY_COST_EXCEEDED',
  INVALID_LIST_PAGINATION: 'INVALID_LIST_PAGINATION',

  // ADR-035: Workspace / RBAC
  WORKSPACE_REQUIRED: 'WORKSPACE_REQUIRED',
  WORKSPACE_ACCESS_DENIED: 'WORKSPACE_ACCESS_DENIED',
  WORKSPACE_ROLE_DENIED: 'WORKSPACE_ROLE_DENIED',

  // ADR-036: Integrity validation (structural only)
  INTEGRITY_CHECK_FAILED: 'INTEGRITY_CHECK_FAILED',
} as const;

export type GraphQLContractErrorCode =
  (typeof GQL_ERROR_CODES)[keyof typeof GQL_ERROR_CODES];

export function contractError(code: GraphQLContractErrorCode): GraphQLError {
  // Enforce canonical shape: message matches extensions.code.
  return new GraphQLError(code, { extensions: { code } });
}
