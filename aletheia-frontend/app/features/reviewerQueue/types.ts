export type ReviewRequestSource = 'comparison' | 'manual';

export type ReviewerQueueItem = {
  /**
   * Local-only identifier (in-memory). Not persisted anywhere.
   */
  id: string;
  claimId: string;
  claimText: string;
  source: ReviewRequestSource;
  /**
   * Optional hint about the originating surface (e.g. "compare" or "claim").
   * This is UI-only coordination context and must not be treated as domain state.
   */
  requestedFrom?: string;
  createdAtMs: number;
};

export type ReviewerQueueSeedItem = {
  claimId: string;
  claimText: string;
  source: ReviewRequestSource;
  requestedFrom?: string;
};

