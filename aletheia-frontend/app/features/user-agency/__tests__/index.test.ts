/**
 * Tests for user-agency index exports
 */

import * as userAgency from '../components';

describe('user-agency index', () => {
  it('should export user-agency components (no ConflictResolver scaffold)', () => {
    expect(userAgency).toHaveProperty('UnknownsList');
    expect(userAgency).not.toHaveProperty('ConflictResolver');
  });
});
