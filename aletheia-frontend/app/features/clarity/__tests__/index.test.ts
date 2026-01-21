/**
 * Tests for clarity index exports
 */

import * as clarity from '../components';

describe('clarity index', () => {
  it('should export clarity components', () => {
    expect(clarity).toHaveProperty('StatusPill');
    expect(clarity).toHaveProperty('TruthStateIndicator');
  });
});
