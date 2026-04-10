import { adjudicationEntryHashHex } from './adjudication-entry-hash';

describe('adjudicationEntryHashHex (ADR-036)', () => {
  it('is deterministic for the same inputs', () => {
    const d = new Date('2026-04-10T12:00:00.000Z');
    const a = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: d,
    });
    const b = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: d,
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when prevHash changes', () => {
    const d = new Date('2026-04-10T12:00:00.000Z');
    const x = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: d,
    });
    const y = adjudicationEntryHashHex({
      prevHash: 'abc',
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: d,
    });
    expect(x).not.toBe(y);
  });
});
