export type ReviewRequestSource = 'CLAIM_VIEW' | 'COMPARISON';

export type ReviewRequestUser = {
  __typename?: 'User';
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Persisted, coordination-only review request (read-only in the queue UI).
 *
 * Contract constraints:
 * - Must be schema-backed (`/src/schema.gql`)
 * - Must not imply claim truth/status changes (ADR-005/008/012)
 * - Must not infer reviewer authority (ADR-014)
 */
export type ReviewRequest = {
  __typename?: 'ReviewRequest';
  id: string;
  claimId: string;
  requestedAt: string;
  source: ReviewRequestSource;
  note?: string | null;
  requestedBy: ReviewRequestUser;
};

