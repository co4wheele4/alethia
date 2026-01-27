import { describe, expect, it } from 'vitest';

import { canTransitionClaim, CLAIM_LIFECYCLE_TRANSITIONS } from '../hooks/useClaimReview';

describe('claim lifecycle guards', () => {
  it('encodes allowed transitions (schema-faithful)', () => {
    expect(CLAIM_LIFECYCLE_TRANSITIONS.DRAFT).toEqual(['REVIEWED']);
    expect(CLAIM_LIFECYCLE_TRANSITIONS.REVIEWED).toEqual(['ACCEPTED', 'REJECTED']);
    expect(CLAIM_LIFECYCLE_TRANSITIONS.ACCEPTED).toEqual([]);
    expect(CLAIM_LIFECYCLE_TRANSITIONS.REJECTED).toEqual([]);
  });

  it('allows only valid transitions', () => {
    expect(canTransitionClaim('DRAFT', 'REVIEWED')).toBe(true);
    expect(canTransitionClaim('REVIEWED', 'ACCEPTED')).toBe(true);
    expect(canTransitionClaim('REVIEWED', 'REJECTED')).toBe(true);

    // No skipping ahead / no editing terminals
    expect(canTransitionClaim('DRAFT', 'ACCEPTED')).toBe(false);
    expect(canTransitionClaim('DRAFT', 'REJECTED')).toBe(false);
    expect(canTransitionClaim('ACCEPTED', 'REVIEWED')).toBe(false);
    expect(canTransitionClaim('REJECTED', 'REVIEWED')).toBe(false);
  });
});

