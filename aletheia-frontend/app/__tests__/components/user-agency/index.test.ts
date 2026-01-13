/**
 * Tests for user-agency index exports
 */

import * as userAgency from '../../../components/user-agency';

describe('user-agency index', () => {
  it('should export user-agency components', () => {
    expect(userAgency).toHaveProperty('ConflictResolver');
  });
});
