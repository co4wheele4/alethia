/**
 * Tests for integrity index exports
 */

import * as integrity from '../../../components/integrity';

describe('integrity index', () => {
  it('should export integrity components', () => {
    expect(integrity).toHaveProperty('SystemStatusPanel');
  });
});
