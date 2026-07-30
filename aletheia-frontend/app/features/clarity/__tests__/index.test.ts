/**
 * Tests for clarity index exports
 */

import * as clarity from '../components';

describe('clarity index', () => {
  it('should export clarity components (no scoring / truth-state scaffolds)', () => {
    expect(clarity).toHaveProperty('StatusPill');
    expect(clarity).not.toHaveProperty('ScoreMeter');
    expect(clarity).not.toHaveProperty('TruthStateIndicator');
    expect(clarity).not.toHaveProperty('UncertaintyBadge');
  });
});
